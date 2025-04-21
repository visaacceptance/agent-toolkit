import { CreatePaymentLinkParams } from './parameters';

// TypeScript declaration for Node.js require function
declare function require(id: string): any;

// Import Node.js modules
const crypto = require('crypto');
const superagent = require('superagent');
const getConfig = require('./config');

const TOOLKIT_HEADER = 'cybersource-agent-toolkit-typescript';
const MCP_HEADER = 'cybersource-mcp';

// Default configuration variables for PayByLink
const DEFAULT_REQUEST_HOST = 'apitest.cybersource.com';
const DEFAULT_MERCHANT_ID = 'visa_acceptance_llm_01';
const DEFAULT_MERCHANT_KEY_ID = '9809ebfb-e5ce-43af-8f2d-90f65770c4bc';
const DEFAULT_MERCHANT_SECRET_KEY = 'K3UY4P0qRlca7fdjzRmVl0yBSefaXZ8OcDhMag9WDtk=';

class CybersourceAPI {
  private requestHost: string;
  private merchantId: string;
  private merchantKeyId: string;
  private merchantSecretKey: string;

  /**
   * Creates a new CybersourceAPI instance
   * @param credentials Optional credentials to override defaults
   */
  constructor(credentials: {
    secretKey?: string;
    merchantId?: string;
    merchantKeyId?: string;
    requestHost?: string;
  } = {}) {
    this.requestHost = credentials.requestHost || DEFAULT_REQUEST_HOST;
    this.merchantId = credentials.merchantId || DEFAULT_MERCHANT_ID;
    this.merchantKeyId = credentials.merchantKeyId || DEFAULT_MERCHANT_KEY_ID;
    this.merchantSecretKey = credentials.secretKey || DEFAULT_MERCHANT_SECRET_KEY;
  }

  /**
   * Convert various parameter types to string form.
   */
  private paramToString(param: any): string {
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
  private normalizeParams(params: Record<string, any>): Record<string, any> {
    const newParams: Record<string, any> = {};
    for (const key in params) {
      if (Object.prototype.hasOwnProperty.call(params, key)) {
        const value = params[key];
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            newParams[key] = value;
          } else {
            newParams[key] = this.paramToString(value);
          }
        }
      }
    }
    return newParams;
  }

  /**
   * Generate a SHA-256 digest of a request string (in base64).
   */
  private generateDigest(payloadString: string): string {
    const buffer = Buffer.from(payloadString, 'utf8');
    const hash = crypto.createHash('sha256');
    hash.update(buffer);
    return hash.digest('base64');
  }

  /**
   * Create an HTTP signature with optional overrides
   * for merchantKeyId, merchantSecretKey, merchantId, requestHost.
   * Accepts the actual request body so the "digest" line in the signature
   * string matches the real payload digest.
   */
  private getHttpSignature(
    resource: string, 
    method: string, 
    overrides: Record<string, any> = {}, 
    rawBodyForPost: string = ''
  ): string {
    console.log("Method : " + method);
    const localMerchantKeyId = overrides.merchantKeyId || this.merchantKeyId;
    const localMerchantSecretKey = overrides.merchantSecretKey || this.merchantSecretKey;
    const localMerchantId = overrides.merchantId || this.merchantId;
    const localRequestHost = overrides.requestHost || this.requestHost;

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
      const actualDigest = this.generateDigest(rawBodyForPost);
      signatureString += `\ndigest: SHA-256=${actualDigest}`;
      if (method === 'patch') {
        console.log("patching");
      }
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
   * @param {CreatePaymentLinkParams} params - The parameters for creating a payment link
   * @param {Object} overrides - Optional overrides for merchantKeyId, merchantSecretKey, merchantId, requestHost.
   */
  async createPaymentLink(params: CreatePaymentLinkParams, overrides: Record<string, any> = {}): Promise<any> {
    return new Promise((resolve, reject) => {
      const resource = '/ipl/v2/payment-links';
      const method = 'post';
      const url = `https://${this.requestHost}${resource}`;

      const requestBody = {
        processingInformation: {
          linkType: params.linkType
        },
        purchaseInformation: {
          purchaseNumber: params.purchaseNumber
        },
        orderInformation: {
          amountDetails: {
            currency: params.currency,
            totalAmount: params.totalAmount
          },
          lineItems: params.lineItems
        }
      };

      const bodyParam = JSON.stringify(requestBody);

      // The real digest matches bodyParam
      const realDigest = `SHA-256=${this.generateDigest(bodyParam)}`;

      // Compute signature with the actual body
      const signature = this.getHttpSignature(resource, method, overrides, bodyParam);

      // We'll use "v-c-date" for the date header
      const vCDate = new Date().toUTCString();

      // If you send "application/hal+json" you may get a 406 if the server doesn't support it
      const headerParams = {
        digest: realDigest,
        'v-c-merchant-id': this.merchantId,
        'v-c-date': vCDate,
        host: this.requestHost,
        signature,
        'User-Agent': 'Mozilla/5.0'
      };

      // Build superagent request
      const request = superagent(method, url)
        .type('application/json')
        .accept('application/json')
        .timeout(60000)
        .set(this.normalizeParams(headerParams))
        .send(bodyParam);

      request.end((error: any, response: any) => {
        const data = response && response.body ? response.body : response ? response.text : null;

        let _status = -1;
        if (response && response.status >= 200 && response.status <= 299) {
          _status = 0;
        }
        
        if (error || _status !== 0) {
          reject(error || new Error('PayByLink POST request returned an error status.'));
        } else {
          resolve(data);
        }
      });
    });
  }

  /**
   * Generic method to run any Cybersource API method
   * @param method The method to run
   * @param args The arguments for the method
   */
  async run(method: string, args: any): Promise<any> {
    switch (method) {
      case 'create_payment_link':
        return this.createPaymentLink(args);
      default:
        throw new Error(`Method ${method} not implemented`);
    }
  }
}

export default CybersourceAPI;