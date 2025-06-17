/* © 2025 Visa.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
import { VisaContext } from './types';
import { Configuration as ImportedConfiguration } from './types';

export type Configuration = ImportedConfiguration;
import { Tool } from './tools';



export type Object =
  | 'invoices'
  | 'paymentLinks';

export type Permission = 'create' | 'update' | 'read';


export type Actions = {
  [K in Object]?: {
    [K in Permission]?: boolean;
  };
} & {
  balance?: {
    read?: boolean;
  };
};

export type Context = {
  mode?: 'modelcontextprotocol' | 'toolkit';
};


/**
 * Creates a context object for the Visa Acceptance API
 * @param options Options for creating the context
 * @returns A VisaContext object
 */
export function createContext(options: any): VisaContext {
  return {
    merchantId: options.merchantId || process.env.VISA_ACCEPTANCE_MERCHANT_ID,
    apiKeyId: options.apiKeyId || process.env.VISA_ACCEPTANCE_API_KEY_ID,
    secretKey: options.secretKey || process.env.VISA_ACCEPTANCE_SECRET_KEY,
    environment: options.environment || process.env.VISA_ACCEPTANCE_ENVIRONMENT || 'SANDBOX',
    mode: options.mode || 'modelcontextprotocol'
  };
}

/**
 * Checks if a tool is allowed based on the configuration
 * @param tool The tool to check
 * @param config The configuration to check against
 * @returns True if the tool is allowed, false otherwise
 */
export function isToolAllowed(tool: Tool, config: Configuration): boolean {
  
  if (!config.actions) {
    return false;
  }

  for (const resource of Object.keys(tool.actions)) {
    const resourcePermissions = tool.actions[resource];
  
    const configResource = config.actions[resource as keyof typeof config.actions];

    
    if (!configResource) {
      return false;
    }
    
    for (const permission of Object.keys(resourcePermissions)) {

      if (resourcePermissions[permission] && !configResource[permission as keyof typeof configResource]) {
        return false;
      }
    }
  }
  
  return true;
}

/**
 * Get Visa Acceptance configuration
 */
export function getVisaAcceptanceConfig(context: VisaContext) {

  const config = {
    authenticationType: 'http_signature',
    runEnvironment: process.env.VISA_ACCEPTANCE_ENVIRONMENT === 'SANDBOX' ? 'apitest.cybersource.com' : 'api.cybersource.com',
    
    /**
     * Merchant credentials 
     */
    merchantID: process.env.VISA_ACCEPTANCE_MERCHANT_ID ||  context.merchantId ||'',
    merchantKeyId: process.env.VISA_ACCEPTANCE_API_KEY_ID || context.apiKeyId || '',
    merchantsecretKey: process.env.VISA_ACCEPTANCE_SECRET_KEY || context.secretKey || '',
    
    keyAlias: process.env.KEY_ALIAS,
    keyPass: process.env.KEY_PASS,
    keyFileName: process.env.KEY_FILENAME,
    keysDirectory: process.env.KEYS_DIRECTORY || 'Resource',
    
    useMetaKey: process.env.USE_META_KEY === 'true' || false,
    portfolioID: process.env.PORTFOLIO_ID,
    
    pemFileDirectory: process.env.PEM_FILE_DIRECTORY,
    
    defaultDeveloperId: process.env.DEFAULT_DEVELOPER_ID,
    
    logConfiguration: {
      enableLog: false,
      logFileName: '',
      logDirectory:  './log',
      logFileMaxSize: '5242880',
      loggingLevel:  'info',
      enableMasking: true,
    }
  };
  
  if (!config.merchantID) {
    console.warn('WARNING: merchantID is empty or undefined in getCybersourceConfig');
  }
  
  return config;
}