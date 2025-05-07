import { VisaContext } from './types';
import { Configuration as ImportedConfiguration } from './types';

// Re-export the Configuration type
export type Configuration = ImportedConfiguration;
import { Tool } from './tools';



export type Object =
  | 'invoices';

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
    merchantId: options.merchantId || process.env.VISA_ACCEPTANCE_MERCHANT_ID || '',
    apiKeyId: options.apiKeyId || process.env.VISA_ACCEPTANCE_API_KEY_ID || '',
    secretKey: options.secretKey || process.env.VISA_ACCEPTANCE_SECRET_KEY || '',
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
  // If no actions are defined in the config, deny access
  if (!config.actions) {
    return false;
  }

  // Check each resource in the tool's actions
  for (const resource of Object.keys(tool.actions)) {
    const resourcePermissions = tool.actions[resource];
    
    // Get the corresponding resource permissions from config
    const configResource = config.actions[resource as keyof typeof config.actions];
    
    // If the resource doesn't exist in config, deny access
    if (!configResource) {
      return false;
    }
    
    // Check each permission for this resource
    for (const permission of Object.keys(resourcePermissions)) {
      // If the permission is required but not granted in config, deny access
      if (resourcePermissions[permission] && !configResource[permission as keyof typeof configResource]) {
        return false;
      }
    }
  }
  
  // All checks passed, allow access
  return true;
}

/**
 * Get Cybersource configuration
 */
export function getCybersourceConfig() {
  // Create a configuration object based on the example provided
  const config = {
    // Authentication settings
    authenticationType: 'http_signature',
    runEnvironment: process.env.VISA_ACCEPTANCE_ENVIRONMENT === 'SANDBOX' ? 'apitest.cybersource.com' : 'api.cybersource.com',
    
    // Merchant credentials - check for both new simplified names AND old names for backward compatibility
    // New simplified names take precedence if both are defined
    merchantID:  process.env.VISA_ACCEPTANCE_MERCHANT_ID,
    merchantKeyId:process.env.VISA_ACCEPTANCE_API_KEY_ID,
    merchantsecretKey: process.env.VISA_ACCEPTANCE_SECRET_KEY,
    
    // JWT parameters
    keyAlias: process.env.KEY_ALIAS,
    keyPass: process.env.KEY_PASS,
    keyFileName: process.env.KEY_FILENAME,
    keysDirectory: process.env.KEYS_DIRECTORY || 'Resource',
    
    // Meta key parameters
    useMetaKey: process.env.USE_META_KEY === 'true' || false,
    portfolioID: process.env.PORTFOLIO_ID,
    
    // PEM file for JWE response decoding
    pemFileDirectory: process.env.PEM_FILE_DIRECTORY,
    
    // Developer ID
    defaultDeveloperId: process.env.DEFAULT_DEVELOPER_ID ,
    
    // Logging configuration
    logConfiguration: {
      enableLog: false,
      logFileName: 'cybs',
      logDirectory:  './log',
      logFileMaxSize: '5242880',
      loggingLevel:  'info',
      enableMasking: true,
      
    }
  };
  
  return config;
}



/**
 * Configuration interface for Cybersource
 */
export interface CybersourceConfiguration {
  authenticationType: string;
  runEnvironment: string;
  merchantID: string;
  merchantKeyId: string;
  merchantsecretKey: string;
  keyAlias: string;
  keyPass: string;
  keyFileName: string;
  keysDirectory: string;
  useMetaKey: boolean;
  portfolioID: string;
  pemFileDirectory: string;
  defaultDeveloperId: string;
  logConfiguration: {
    enableLog: boolean | string,
    logFileName: string,
    logDirectory: string,
    logFileMaxSize: string,
    loggingLevel: 'debug' | 'info' | 'warn' | 'error',
    enableMasking: boolean,
    isLogEnabled?: () => boolean,
    getLogFileName?: () => string,
    getLogDirectory?: () => string,
    getLoggingLevel?: () => string,
    isMaskingEnabled?: () => boolean,
    isExternalLoggerSet?: () => boolean,
    getMaxLogFiles?: () => number,
    getDefaultLoggingProperties?: () => void
  };
}