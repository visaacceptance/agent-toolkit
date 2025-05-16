import { z } from 'zod';
import { Tool } from '../tools';
import { VisaContext } from '../types';
import { Context } from '../configuration';
const cybersourceRestApi = require('cybersource-rest-client');

export const getInvoiceParameters = (
  context: VisaContext = {} as VisaContext
): z.AnyZodObject => {
  return z.object({
    id: z.string().describe('Invoice ID (required)')
  });
};

export const getInvoicePrompt = (context: VisaContext = {} as VisaContext) => `
This tool will get a specific invoice from Visa Acceptance.
`;

export const getInvoice = async (
  visaClient: any,
  context: VisaContext,
  params: z.infer<ReturnType<typeof getInvoiceParameters>>
) => {
  try {
    
    // Create the InvoicesApi instance with the client configuration
    const invoiceApiInstance = new cybersourceRestApi.InvoicesApi(visaClient.configuration, visaClient.visaApiClient);
    
    // Call the Cybersource API to get an invoice by ID
    const result = await new Promise((resolve, reject) => {
      invoiceApiInstance.getInvoice(params.id, (error: any, data: any) => {
        if (error) {
          reject(error);
        } else {
          resolve(data);
        }
      });
    });
    
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ?
      `Failed to get invoice: ${error.message}` :
      'Failed to get invoice: Unknown error';

    
    // Return error diagnostic information
    return {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    };
  }
};

const tool = (context: VisaContext): Tool => ({
  method: 'get_invoice',
  name: 'Get Invoice',
  description: getInvoicePrompt(context),
  parameters: getInvoiceParameters(context),
  actions: {
    invoices: {
      get: true,
    },
  },
  execute: getInvoice,
});

export default tool;