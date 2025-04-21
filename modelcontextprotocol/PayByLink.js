'use strict';

const superagent = require('superagent');
const crypto = require('crypto');

// Configuration variables for PayByLink
const requestHost = 'apitest.cybersource.com';
const merchantId = 'visa_acceptance_llm_01';
const merchantKeyId = '9809ebfb-e5ce-43af-8f2d-90f65770c4bc';
const merchantSecretKey = 'K3UY4P0qRlca7fdjzRmVl0yBSefaXZ8OcDhMag9WDtk=';

/**
 * Convert various parameter types to string form.
 */
function paramToString(param) {
  if (param === undefined || param === null) {
    return '';
  }
  if (param instanceof Date) {
    return param.toJSON();
  }
  return param.toString();
}

/**
 * Normalize header parameters for superagent.
 */
function normalizeParams(params) {
  const newParams = {};
  for (const key in params) {
    if (Object.prototype.hasOwnProperty.call(params, key)) {
      const value = params[key];
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          newParams[key] = value;
        } else {
          newParams[key] = paramToString(value);
        }
      }
    }
  }
  return newParams;
}

/**
 * Generate a SHA-256 digest of a request string (in base64).
 */
function generateDigest(payloadString) {
  const buffer = Buffer.from(payloadString, 'utf8');
  const hash = crypto.createHash('sha256');
  hash.update(buffer);
  return hash.digest('base64');
}

/**
 * Overloaded method to create an HTTP signature with optional overrides
 * for merchantKeyId, merchantSecretKey, merchantId, requestHost.
 * Accepts the actual request body so the "digest" line in the signature
 * string matches the real payload digest.
 */
function getHttpSignatureOverload(resource, method, request, overrides = {}, rawBodyForPost = '') {
  const localMerchantKeyId = overrides.merchantKeyId || merchantKeyId;
  const localMerchantSecretKey = overrides.merchantSecretKey || merchantSecretKey;
  const localMerchantId = overrides.merchantId || merchantId;
  const localRequestHost = overrides.requestHost || requestHost;

  let signatureHeader = '';
  let signatureValue = '';

  // KeyId is the key obtained from EBC
  signatureHeader += `keyid="${localMerchantKeyId}"`;
  // Algorithm is always HmacSHA256 for HTTP signature
  signatureHeader += ', algorithm="HmacSHA256"';

  // For GET or POST, set the list of headers to exactly:
  //   "host v-c-date request-target v-c-merchant-id" (GET)
  //   "host v-c-date request-target digest v-c-merchant-id" (POST)
  if (method === 'get') {
    signatureHeader += ', headers="host v-c-date request-target v-c-merchant-id"';
} else if (method === 'post' || method === 'patch') {
    signatureHeader += ', headers="host v-c-date request-target digest v-c-merchant-id"';
  } else {
    // fallback or future method handling
    signatureHeader += ', headers="host v-c-date request-target v-c-merchant-id"';
  }

  // Build signature string
  let signatureString = `host: ${localRequestHost}`;
  signatureString += `\nv-c-date: ${new Date().toUTCString()}`;
  signatureString += `\nrequest-target: ${method} ${resource}`;

  // For POST, the "digest" must match the real request body
  if (method === 'post' || method === 'patch') {
    const actualDigest = generateDigest(rawBodyForPost);
    signatureString += `\ndigest: SHA-256=${actualDigest}`;
  }

  signatureString += `\nv-c-merchant-id: ${localMerchantId}`;

  // Sign with merchant secret key
  const data = Buffer.from(signatureString, 'utf8');
  const key = Buffer.from(localMerchantSecretKey, 'base64');
  signatureValue = crypto.createHmac('sha256', key).update(data).digest('base64');

  signatureHeader += `, signature="${signatureValue}"`;
  return signatureHeader;
}

/**
 * Call the CyberSource PayByLink API (POST) using HTTP signature auth.
 * @param {string|null} body - The stringified JSON body for your PayByLink call.
 * @param {Function} callback - The callback to execute upon completion (error, data, response, status).
 * @param {Object} overrides - Optional overrides for merchantKeyId, merchantSecretKey, merchantId, requestHost.
 */
function processPayByLink(body, callback, overrides = {}) {
  const resource = '/ipl/v2/payment-links';
  const method = 'post';
  const url = `https://${requestHost}${resource}`;

  // If no body was provided, use a default example
  let bodyParam = body;
  if (!bodyParam) {
    bodyParam = JSON.stringify({
      processingInformation: {
        linkType: 'PURCHASE'
      },
      purchaseInformation: {
        purchaseNumber: Math.random().toString(36).substring(7)
      },
      orderInformation: {
        amountDetails: {
          currency: 'USD',
          totalAmount: '60'
        },
        lineItems: [
          {
            productName: 'Birthday Cake',
            unitPrice: '60'
          }
        ]
      }
    });
  }

  // The real digest matches bodyParam
  const realDigest = `SHA-256=${generateDigest(bodyParam)}`;

  // Compute signature with the actual body
  const signature = getHttpSignatureOverload(resource, method, null, overrides, bodyParam);

  // We'll use "v-c-date" for the date header
  const vCDate = new Date().toUTCString();

  // Debug info


  // If you send "application/hal+json" you may get a 406 if the server doesn't support it
  const headerParams = {
    digest: realDigest,
    'v-c-merchant-id': merchantId,
    'v-c-date': vCDate,
    host: requestHost,
    signature,
    'User-Agent': 'Mozilla/5.0'
  };

  // Build superagent request
  const request = superagent(method, url)
    .type('application/json')
    .accept('application/json')
    .timeout(60000)
    .set(normalizeParams(headerParams))
    .send(bodyParam);

  request.end((error, response) => {
    const data = response && response.body ? response.body : response ? response.text : null;


    let _status = -1;
    if (response && response.status >= 200 && response.status <= 299) {
      _status = 0;
    }
    callback(error, data, response.body, _status);
  });
}

/**
 * Call the CyberSource PayByLink API (GET) using HTTP signature auth.
 * @param {Function} callback - The callback to execute upon completion (error, data, response, status).
 * @param {Object} overrides - Optional overrides for merchantKeyId, merchantSecretKey, merchantId, requestHost.
 */
function processPayByLinkGet(callback, overrides = {}) {
  const resource = '/ipl/v2/payment-links';
  const method = 'get';
  const url = `https://${requestHost}${resource}`;

  // We'll use v-c-date for the date header
  const vCDate = new Date().toUTCString();

  // Compute custom signature with no body for GET
  const signature = getHttpSignatureOverload(resource, method, null, overrides);

  const headerParams = {
    'v-c-merchant-id': merchantId,
    'v-c-date': vCDate,
    host: requestHost,
    signature,
    'User-Agent': 'Mozilla/5.0'
  };

  // Build superagent request
  const request = superagent(method, url)
    .type('application/json')
    .accept('application/json')
    .timeout(60000)
    .set(normalizeParams(headerParams));

    request.end((error, response) => {
      
      if (!response) {
        console.log('No response received');
        return callback(error || new Error('No response received'), null, null, -1);
      }
    
      
      // Properly handle response body based on its format
      let responseData;
      try {
        // If response.body is already an object
        if (response.body && typeof response.body === 'object') {
          responseData = response.body;
        } 
        // If response.text is a function (as in some HTTP clients)
        else if (response.text && typeof response.text === 'function') {
          const textContent = response.text();
          responseData = JSON.parse(textContent);
        }
        // If response.text is a string
        else if (response.text && typeof response.text === 'string') {
          responseData = JSON.parse(response.text);
        }
        // Fallback to raw response if nothing else works
        else {
          responseData = response;
        }
        
        
        const statusCode = response.status >= 200 && response.status <= 299 ? 0 : -1;
        callback('', responseData, responseData, statusCode);
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        callback(parseError, null, response, -1);
      }
    });
}

// If someone runs this file directly, show a usage example
if (require.main === module) {
  // Provide a custom body to processPayByLink, or pass null to use default
  const customBody = JSON.stringify({
    processingInformation: {
      linkType: 'PURCHASE'
    },
    purchaseInformation: {
      purchaseNumber: Math.random().toString(36).substring(7)
    },
    orderInformation: {
      amountDetails: {
        currency: 'USD',
        totalAmount: '42'
      },
      lineItems: [
        {
          productName: 'Delicious Candy',
          unitPrice: '42'
        }
      ]
    }
  });

  // POST call
  processPayByLink(customBody, (err, data, resp, status) => {
    if (err) {
      console.error('PayByLink POST request failed:', err);
    } else if (status === 0) {
    } else {
      console.log('PayByLink POST request returned an error status.');
    }



  });
}

function updatePayByLink(linkId, body, callback, overrides = {}) {
  const resource = `/ipl/v2/payment-links/${linkId}`;
  const method = 'patch';
  const url = `https://${requestHost}${resource}`;

  // The real digest matches body
  const realDigest = `SHA-256=${generateDigest(body)}`;

  // Compute signature with the actual body
  const signature = getHttpSignatureOverload(resource, method, null, overrides, body);

  // We'll use "v-c-date" for the date header
  const vCDate = new Date().toUTCString();

  const headerParams = {
    digest: realDigest,
    'v-c-merchant-id': merchantId,
    'v-c-date': vCDate,
    host: requestHost,
    signature,
    'User-Agent': 'Mozilla/5.0'
  };

  const request = superagent(method, url)
    .type('application/json')
    .accept('application/json')
    .timeout(60000)
    .set(normalizeParams(headerParams))
    .send(body);

  request.end((error, response) => {
    const data = response && response.body ? response.body : response ? response.text : null;
    let _status = -1;
    if (response && response.status >= 200 && response.status <= 299) {
      _status = 0;
    }
    callback(error, data, response && response.body, _status);
  });
}

module.exports = {
  processPayByLink,
  processPayByLinkGet,
  updatePayByLink
};

