"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createContext = createContext;
exports.isToolAllowed = isToolAllowed;
exports.getVisaAcceptanceConfig = getVisaAcceptanceConfig;
/**
 * Creates a context object for the Visa Acceptance API
 * @param options Options for creating the context
 * @returns A VisaContext object
 */
function createContext(options) {
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
function isToolAllowed(tool, config) {
    if (!config.actions) {
        return false;
    }
    for (const resource of Object.keys(tool.actions)) {
        const resourcePermissions = tool.actions[resource];
        const configResource = config.actions[resource];
        if (!configResource) {
            return false;
        }
        for (const permission of Object.keys(resourcePermissions)) {
            if (resourcePermissions[permission] && !configResource[permission]) {
                return false;
            }
        }
    }
    return true;
}
/**
 * Get Visa Acceptance configuration
 */
function getVisaAcceptanceConfig(context) {
    const config = {
        authenticationType: 'http_signature',
        runEnvironment: process.env.VISA_ACCEPTANCE_ENVIRONMENT === 'SANDBOX' ? 'apitest.cybersource.com' : 'api.cybersource.com',
        /**
         * Merchant credentials
         */
        merchantID: process.env.VISA_ACCEPTANCE_MERCHANT_ID || context.merchantId || '',
        merchantKeyId: process.env.VISA_ACCEPTANCE_API_KEY_ID || context.apiKeyId || '',
        merchantsecretKey: process.env.VISA_ACCEPTANCE_SECRET_KEY || context.secretKey || '',
        keyAlias: process.env.KEY_ALIAS,
        keyPass: process.env.KEY_PASS,
        keyFileName: process.env.KEY_FILENAME,
        keysDirectory: process.env.KEYS_DIRECTORY || 'Resource',
        useMetaKey: process.env.USE_META_KEY === 'true' || false,
        portfolioID: process.env.PORTFOLIO_ID,
        pemFileDirectory: process.env.PEM_FILE_DIRECTORY,
        defaultDeveloperId: context.mode === 'modelcontextprotocol' ? 'N05YN5UH' : 'A2R8EP3K',
        logConfiguration: {
            enableLog: false,
            logFileName: 'vap.log',
            logDirectory: 'vap',
            logFileMaxSize: '5242880',
            loggingLevel: 'info',
            enableMasking: true,
        }
        /* END GENAI */
    };
    if (!config.merchantID) {
        console.warn('WARNING: merchantID is empty or undefined in getCybersourceConfig');
    }
    return config;
}
