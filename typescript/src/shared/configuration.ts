// Converted from config.js to configuration.ts for Cybersource API usage

import * as dotenv from 'dotenv';
dotenv.config();
import type {Tool} from './tools'

export type Object =
  | 'invoices'
  | 'paymentLinks'
  | 'refunds'
  | 'subscriptions'
  | 'documentation';

export type Permission = 'create' | 'update' | 'read';

export type Configuration = {
  actions?: Actions;
  context?: Context;
}

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
 * Configuration for Cybersource integration. 
 * The environment variables used here match the ones
 * previously used in the original config.js, 
 * but now expressed in TypeScript.
 */

// Determine which environment to use based on 
// the presence of CYBERSOURCE_USE_TEST_ENV
const runEnvironment = process.env.CYBERSOURCE_USE_TEST_ENV === 'true'
  ? 'apitest.cybersource.com'
  : 'api.cybersource.com';

// Consolidate all config parameters into a single
// typed configuration object for Cybersource
export interface CybersourceConfiguration {
  authenticationType: string;
  runEnvironment: string;
  merchantID: string;
  merchantKeyId: string;
  merchantSecretKey: string;
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
    enableMasking: boolean
  };
}

// Create a function to read from environment variables 
// or default to the same values found in config.js
export function getCybersourceConfig(): CybersourceConfiguration {
  // common parameters
  const authenticationType = process.env.CYBERSOURCE_AUTH_TYPE || 'http_signature';
  const merchantID = process.env.CYBERSOURCE_MERCHANT_ID;
  const merchantKeyId = process.env.CYBERSOURCE_API_KEY_ID;
  const merchantSecretKey = process.env.CYBERSOURCE_SECRET_KEY;

  if (!merchantID || !merchantKeyId || !merchantSecretKey) {
    throw new Error('Missing required Cybersource configuration. Please check your environment variables.');
  }

  // JWT params
  const keysDirectory = 'Resource';
  const keyFileName = process.env.CYBERSOURCE_KEY_FILENAME || 'testrest';
  const keyAlias = process.env.CYBERSOURCE_KEY_ALIAS || 'testrest';
  const keyPass = process.env.CYBERSOURCE_KEY_PASSWORD || 'testrest';

  // Meta key
  const useMetaKey = false;
  const portfolioID = '';

  // PEM file / JWE
  const pemFileDirectory = 'Resource/NetworkTokenCert.pem';

  // Developer ID override
  const defaultDeveloperId = '';

  // logging parameters
  const enableLogString = process.env.ENABLE_LOGGING || 'false';
  const enableLog = enableLogString === 'true';
  const logFileName = process.env.LOG_FILENAME || 'cybs';
  const logDirectory = './log';
  const logFileMaxSize = process.env.LOG_FILE_MAX_SIZE || '5242880'; // 10 MB In Bytes
  const loggingLevel: 'debug' = 'debug';
  const enableMasking = true;

  return {
    authenticationType,
    runEnvironment,
    merchantID,
    merchantKeyId,
    merchantSecretKey,
    keyAlias,
    keyPass,
    keyFileName,
    keysDirectory,
    useMetaKey,
    portfolioID,
    pemFileDirectory,
    defaultDeveloperId,
    logConfiguration: {
      enableLog,
      logFileName,
      logDirectory,
      logFileMaxSize,
      loggingLevel,
      enableMasking
    }
  };
}

export const isToolAllowed = (
  tool: Tool,
  configuration: CybersourceConfiguration
): boolean => {
  return Object.keys(tool.actions).every((resource) => {
    // For each resource.permission pair, check the configuration.
    // @ts-ignore
    const permissions = tool.actions[resource];

    return Object.keys(permissions).every((permission) => {
      // @ts-ignore
      return configuration.actions[resource]?.[permission] === true;
    });
  });
};
