/* © 2025 Visa.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import { VisaContext } from "@/shared/types";

require('dotenv').config({ path: 'src/test/integration/.env.test' });
const cybersourceRestApi = require('cybersource-rest-client');

type VisaAcceptanceClientAndContext = {
  client: {
    visaApiClient: {
      visaApiClient: any,
      configuration: ReturnType<typeof getVisaAcceptanceConfig>,
    }
    configuration: ReturnType<typeof getVisaAcceptanceConfig>
  };
  context: VisaContext;
};

let visaAcceptanceClientAndContext: VisaAcceptanceClientAndContext;

export function getVisaAcceptanceClientAndContext() {
  if (visaAcceptanceClientAndContext) {
    return visaAcceptanceClientAndContext;
  }

  const visaAcceptanceContext = {
    merchantId: process.env.VISA_ACCEPTANCE_MERCHANT_ID || '',
    apiKeyId: process.env.VISA_ACCEPTANCE_API_KEY_ID || '',
    secretKey: process.env.VISA_ACCEPTANCE_SECRET_KEY || '',
    environment: process.env.VISA_ACCEPTANCE_ENVIRONMENT || '',
  };
  const configuration = getVisaAcceptanceConfig();

  // Initialize the API client and set the configuration
  const apiClient = new cybersourceRestApi.ApiClient();
  apiClient.setConfiguration(configuration);

  const visaAcceptanceClient = {
    visaApiClient: apiClient,
    configuration,
  }

  visaAcceptanceClientAndContext = {
    client: visaAcceptanceClient,
    context: visaAcceptanceContext,
  }

  return visaAcceptanceClientAndContext;
}

/**
 * Get Cybersource configuration
 */
const getVisaAcceptanceConfig = () => {
  const config = {
    authenticationType: 'http_signature',
    runEnvironment: process.env.VISA_ACCEPTANCE_ENVIRONMENT === 'SANDBOX' ? 'apitest.cybersource.com' : 'api.cybersource.com',
    
    /**
     * Merchant credentials - check for both new simplified names AND old names for backward compatibility
     * New simplified names take precedence if both are defined
     */
    merchantID: process.env.VISA_ACCEPTANCE_MERCHANT_ID || '',
    merchantKeyId: process.env.VISA_ACCEPTANCE_API_KEY_ID || '',
    merchantsecretKey: process.env.VISA_ACCEPTANCE_SECRET_KEY || '',
    
    keyAlias: process.env.KEY_ALIAS,
    keyPass: process.env.KEY_PASS,
    keyFileName: process.env.KEY_FILENAME,
    keysDirectory: process.env.KEYS_DIRECTORY || 'Resource',
    
    useMetaKey: process.env.USE_META_KEY === 'true' || false,
    portfolioID: process.env.PORTFOLIO_ID,
    
    pemFileDirectory: process.env.PEM_FILE_DIRECTORY,
    
    defaultDeveloperId: process.env.DEFAULT_DEVELOPER_ID,
    
    disableSSLVerification: process.env.NODE_TLS_REJECT_UNAUTHORIZED === '0',
    
    logConfiguration: {
      enableLog: true,
      logFileName: 'cybs.log',
      logDirectory: './log',
      logFileMaxSize: '5242880',
      loggingLevel: 'info',
      enableMasking: true,
    },
  };
  
  if (!config.merchantID) {
    console.warn('WARNING: merchantID is empty or undefined in getVisaAcceptanceConfig');
  }
  
  return config;
}