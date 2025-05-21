import { VisaContext } from './types';
import tools, { Tool } from './tools';
import { getCybersourceConfig } from './configuration';
const cybersourceRestApi = require('cybersource-rest-client');

// TypeScript declaration for Node.js require function
declare function require(id: string): any;

// Import Node.js modules
const crypto = require('crypto');
const superagent = require('superagent');

const TOOLKIT_HEADER = 'visa-acceptance-agent-toolkit-typescript';
const MCP_HEADER = 'visa-acceptance-mcp';

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
    const config = getCybersourceConfig();

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
      defaultDeveloperId: config.defaultDeveloperId,
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