"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const tools_1 = __importDefault(require("./tools"));
const configuration_1 = require("./configuration");
const cybersourceRestApi = require('cybersource-rest-client');
/**
 * API Client for Visa Acceptance API
 */
class VisaAcceptanceAPI {
    requestHost;
    merchantId;
    merchantKeyId;
    merchantSecretKey;
    _apiClient;
    context;
    tools;
    /**
     * Creates a new VisaAcceptanceAPI instance
     * @param context The Visa context containing credentials
     */
    constructor(context) {
        this.merchantId = context.merchantId;
        this.merchantKeyId = context.apiKeyId;
        this.merchantSecretKey = context.secretKey;
        this.requestHost = context.environment === 'SANDBOX' ?
            'apitest.cybersource.com' : 'api.cybersource.com';
        this.context = context || {};
        this.tools = (0, tools_1.default)(this.context);
        // Get proper configuration and initialize the API client with it
        const config = (0, configuration_1.getVisaAcceptanceConfig)(context);
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
        };
    }
    async run(method, arg) {
        const tool = this.tools.find((t) => t.method === method);
        if (tool) {
            const output = JSON.stringify(await tool.execute(this._apiClient, this.context, arg));
            return output;
        }
        else {
            throw new Error('Invalid method ' + method);
        }
    }
}
exports.default = VisaAcceptanceAPI;
/* END GENAI */ 
