// Node.js global declarations
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      VISA_ACCEPTANCE_MERCHANT_ID?: string;
      VISA_ACCEPTANCE_API_KEY_ID?: string;
      VISA_ACCEPTANCE_SECRET_KEY?: string;
      VISA_ACCEPTANCE_ENVIRONMENT?: string;
      KEY_ALIAS?: string;
      KEY_PASS?: string;
      KEY_FILENAME?: string;
      KEYS_DIRECTORY?: string;
      USE_META_KEY?: string;
      PORTFOLIO_ID?: string;
      PEM_FILE_DIRECTORY?: string;
      DEFAULT_DEVELOPER_ID?: string;
    }
  }

  var process: NodeJS.Process;
  var require: NodeRequire;
  var module: NodeModule;
}

// Extend the existing declarations for 'cybersource-rest-client'
// so TypeScript recognizes InvoicingV2InvoicesPost201Response and InvoicesApi.

declare module 'cybersource-rest-client' {
  // Minimal type definition for the 201 response object.
  export interface InvoicingV2InvoicesPost201Response {
    id?: string;
    invoiceInformation?: {
      invoiceNumber?: string;
      description?: string;
      dueDate?: string;
      allowPartialPayments?: boolean;
      paymentLink?: string;
      deliveryMode?: string;
    };
    // define other respected invoice fields here
  }

  // Minimal class definition for InvoicesApi used in createInvoice
  export class InvoicesApi {
    createInvoice(
      request: unknown,
      callback: (err: unknown, data: InvoicingV2InvoicesPost201Response) => void
    ): void;
  }
}

export {};
