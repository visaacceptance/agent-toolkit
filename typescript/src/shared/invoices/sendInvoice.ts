import { z } from 'zod';
import { Tool } from '../tools';
import { VisaContext } from '../types';
import { Context } from '../configuration';
import { maskInvoiceCustomerInfo } from '../utils/masking';
const cybersourceRestApi = require('cybersource-rest-client');

export const sendInvoiceParameters = (
  context: VisaContext = {} as VisaContext
) => {
  return z.object({
    invoice_id: z.string().describe('Invoice ID (required)')
  });
};

export const sendInvoicePrompt = (context: VisaContext = {} as VisaContext) => `
This tool will send an invoice to the customer from Visa Acceptance.
`;

export const sendInvoice = async (
  visaClient: any,
  context: VisaContext,
  params: z.infer<ReturnType<typeof sendInvoiceParameters>>
) => {
  try {
    // Create the InvoicesApi instance with the client configuration
    const invoiceApiInstance = new cybersourceRestApi.InvoicesApi(visaClient.configuration, visaClient.visaApiClient);
    
    // Call the Cybersource API to send an invoice
    const result = await new Promise((resolve, reject) => {
      invoiceApiInstance.performSendAction(params.invoice_id, (error: any, data: any, response: any) => {
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
      `Failed to send invoice: ${error.message}` :
      'Failed to send invoice: Unknown error';
    
    console.error('Error in sendInvoice tool:', errorMessage);
    
    // Return error diagnostic information
    return {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    };
  }
};

const tool = (context: VisaContext): Tool => ({
  method: 'send_invoice',
  name: 'Send Invoice',
  description: sendInvoicePrompt(context),
  parameters: sendInvoiceParameters(context),
  actions: {
    invoices: {
      update: true,
    },
  },
  execute: sendInvoice,
});

export default tool;