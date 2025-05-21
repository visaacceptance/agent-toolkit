import { z } from 'zod';
import { Tool } from '../tools';
import { VisaContext } from '../types';
import { Context } from '../configuration';
const cybersourceRestApi = require('cybersource-rest-client');
import { maskInvoiceCustomerInfo } from '../utils/masking';
export const cancelInvoiceParameters = (
  context: VisaContext = {} as VisaContext
): z.AnyZodObject => {
  return z.object({
    invoice_id: z.string().describe('Invoice ID (required)')
  });
};

export const cancelInvoicePrompt = (context: VisaContext = {} as VisaContext) => `
This tool will cancel an invoice in Visa Acceptance.
`;

export const cancelInvoice = async (
  visaClient: any,
  context: VisaContext,
  params: z.infer<ReturnType<typeof cancelInvoiceParameters>>
) => {
  try {
    // Create the InvoicesApi instance with the client configuration
    const invoiceApiInstance = new cybersourceRestApi.InvoicesApi(visaClient.configuration, visaClient.visaApiClient);
    
    // Call the Cybersource API to cancel an invoice
    const result = await new Promise((resolve, reject) => {
      invoiceApiInstance.performCancelAction(params.invoice_id, (error: any, data: any, response: any) => {
        if (error) {
          console.error('Error from Cybersource API:', error);
          reject(error);
        } else {
          console.error('Response from Cybersource API:', JSON.stringify(data, null, 2));
          resolve({
            data,
            status: response['status']
          });
        }
      });
    });
    const maskedResult = maskInvoiceCustomerInfo(result);
    return maskedResult;
  } catch (error) {
    const errorMessage = error instanceof Error ?
      `Failed to cancel invoice: ${error.message}` :
      'Failed to cancel invoice: Unknown error';
    
    console.error('Error in cancelInvoice tool:', errorMessage);
    
    // Return error diagnostic information
    return {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    };
  }
};

const tool = (context: VisaContext): Tool => ({
  method: 'cancel_invoice',
  name: 'Cancel Invoice',
  description: cancelInvoicePrompt(context),
  parameters: cancelInvoiceParameters(context),
  actions: {
    invoices: {
      update: true,
    },
  },
  execute: cancelInvoice,
});

export default tool;