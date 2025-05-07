import { z } from 'zod';

/**
 * Context interface for Visa Acceptance API
 */
export interface VisaContext {
  merchantId: string;
  apiKeyId: string;
  secretKey: string;
  environment: string;
  mode?: string;
}

/**
 * Configuration interface for tools and permissions
 */
export interface Configuration {
  actions?: {
    invoices?: {
      create?: boolean;
      read?: boolean;
      update?: boolean;
      list?: boolean;
      get?: boolean;
    };
    paymentLinks?: {
      create?: boolean;
      read?: boolean;
      update?: boolean;
      list?: boolean;
    };
    refunds?: {
      create?: boolean;
      read?: boolean;
      list?: boolean;
    };
    subscriptions?: {
      create?: boolean;
      read?: boolean;
      update?: boolean;
      list?: boolean;
    };
    // Add more resources as needed
  };
  context?: {
    mode?: string;
  };
}

/**
 * Tool execution result interface
 */
export interface ToolExecutionResult {
  success: boolean;
  data?: any;
  error?: string;
}