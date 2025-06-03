import { z } from 'zod';

export interface VisaContext {
  merchantId: string;
  apiKeyId: string;
  secretKey: string;
  environment: string;
  mode?: string;
}

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
  };
  context?: {
    mode?: string;
  };
}

export interface ToolExecutionResult {
  success: boolean;
  data?: any;
  error?: string;
}