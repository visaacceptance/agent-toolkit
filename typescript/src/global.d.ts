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
