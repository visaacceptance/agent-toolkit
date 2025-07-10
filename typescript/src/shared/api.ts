/* © 2025 Visa.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
/* START GENAI */
import { VisaContext } from './types';
import tools, { Tool } from './tools';
import { getVisaAcceptanceConfig } from './configuration';
const cybersourceRestApi = require('cybersource-rest-client');

// TypeScript declaration for Node.js require function
declare function require(id: string): any;


/**
 * API Client for Visa Acceptance API
 */
class VisaAcceptanceAPI {
  private requestHost: string;
  private merchantId: string;
  private merchantKeyId: string;
  private merchantSecretKey: string;
  _apiClient: any;

  context: VisaContext;
  tools: Tool[];

  /**
   * Creates a new VisaAcceptanceAPI instance
   * @param context The Visa context containing credentials
   */
  constructor(context: VisaContext) {
    this.merchantId = context.merchantId;
    this.merchantKeyId = context.apiKeyId;
    this.merchantSecretKey = context.secretKey;
    this.requestHost = context.environment === 'SANDBOX' ?
      'apitest.cybersource.com' : 'api.cybersource.com';
    this.context = context || {};
    this.tools = tools(this.context);
    
    // Get proper configuration and initialize the API client with it
    const config = getVisaAcceptanceConfig(context);

    // Override config with context values if provided
    const configObj = {
      authenticationType: config.authenticationType,
      runEnvironment: this.requestHost,
      merchantID: this.merchantId || config.merchantID,
      merchantKeyId: this.merchantKeyId || config.merchantKeyId,
      merchantsecretKey: this.merchantSecretKey || config.merchantsecretKey,
      keyAlias: config.keyAlias,
      keyPass: config.keyPass,
      keyFileName: config.keyFileName,
      keysDirectory: config.keysDirectory,
      useMetaKey: config.useMetaKey,
      portfolioID: config.portfolioID,
      pemFileDirectory: config.pemFileDirectory,
      defaultDeveloperId: 'A2R8EP3K',
      logConfiguration: config.logConfiguration
    };

    // Initialize the API client and set the configuration
    const apiClient = new cybersourceRestApi.ApiClient();
    apiClient.setConfiguration(configObj);
    this._apiClient = {
      visaApiClient: apiClient,
      configuration: configObj
    }
  }

  async run(method: string, arg: any) {
    
    const tool = this.tools.find((t) => t.method === method);
    if (tool) {
      const output = JSON.stringify(
        await tool.execute(this._apiClient, this.context, arg)
      );
      return output;
    } else {
      throw new Error('Invalid method ' + method);
    }
  }

  
}

export default VisaAcceptanceAPI;
/* END GENAI */