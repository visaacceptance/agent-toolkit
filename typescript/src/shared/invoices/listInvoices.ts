import { z } from 'zod';
import { Tool } from '../tools';
import { VisaContext } from '../types';
import { Context } from '../configuration';
import { maskInvoicesCustomerInfo } from '../utils/masking';
const cybersourceRestApi = require('cybersource-rest-client');

export const listInvoicesParameters = (
  context: VisaContext = {} as VisaContext
) => {
  return z.object({
    offset: z.number().describe('Pagination offset (required)'),
    limit: z.number().describe('Pagination limit (required)'),
    status: z.string().optional().describe('Filter by status (optional)')
  });
};

export const listInvoicesPrompt = (context: VisaContext = {} as VisaContext) => `
This tool will list invoices from Visa Acceptance. Both offset and limit parameters are required.
`;

export const listInvoices = async (
  visaClient: any,
  context: VisaContext,
  params: z.infer<ReturnType<typeof listInvoicesParameters>>
) => {
  try {
    // Create the InvoicesApi instance with the client configuration
    const invoiceApiInstance = new cybersourceRestApi.InvoicesApi(visaClient.configuration, visaClient.visaApiClient);
    const result = await new Promise((resolve, reject) => {
      invoiceApiInstance.getAllInvoices(
        params.offset,
        params.limit,
        params.status,
        (error: any, data: any) => {
          if (error) {
            reject(error);
          } else {
            resolve(data);
          }
        }
      );
    });
    
    // Apply PII masking to customer information in all invoices before returning the result
    // The result may contain an array of invoices or a single invoice with embedded invoices
    let maskedResult = result;
    
    // Use type assertion to handle the dynamic structure of the result
    const typedResult = result as any;
    
    if (typedResult && typedResult.invoices && Array.isArray(typedResult.invoices)) {
      // If result contains an array of invoices, mask each one
      maskedResult = {
        ...typedResult,
        invoices: maskInvoicesCustomerInfo(typedResult.invoices)
      };
    } else {
      // If the structure is different, apply general masking
      maskedResult = maskInvoicesCustomerInfo([typedResult])[0];
    }
    
    return maskedResult;

  } catch (error) {
    const errorMessage = error instanceof Error ?
      `Failed to list invoices: ${error.message}` :
      'Failed to list invoices: Unknown error';
    
    console.error('Error in listInvoices tool:', error);
    
    // Return error diagnostic information
    return {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    };
  }
};

const tool = (context: VisaContext): Tool => ({
  method: 'list_invoices',
  name: 'List Invoices',
  description: listInvoicesPrompt(context),
  parameters: listInvoicesParameters(context),
  actions: {
    invoices: {
      read: true,
    },
  },
  execute: listInvoices,
});

export default tool;