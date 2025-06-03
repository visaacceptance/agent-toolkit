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
This tool will list invoices from Visa Acceptance.
`;

export const listInvoices = async (
  visaClient: any,
  context: VisaContext,
  params: z.infer<ReturnType<typeof listInvoicesParameters>>
) => {
  try {
    const invoiceApiInstance = new cybersourceRestApi.InvoicesApi(visaClient.configuration, visaClient.visaApiClient);
    const opts: { status?: string } = {};
    if (params.status != null && params.status !== '') {
      opts.status = params.status;
    }
    console.log('Sending request with params:', JSON.stringify({ offset: params.offset, limit: params.limit, opts }));
    const result = await new Promise((resolve, reject) => {
      invoiceApiInstance.getAllInvoices(
        params.offset,
        params.limit,
        opts,
        (error: any, data: any, response: any) => {
          if (error) {
            console.error('Error in listInvoices:', JSON.stringify(error));
            reject(error);
          } else {
            console.log('Response from getAllInvoices:', JSON.stringify(response));
            resolve(data);
          }
        }
      );
    });
    
    const typedResult = result as any;
    let maskedResult = maskInvoicesCustomerInfo(typedResult);
    return maskedResult;
  } catch (error) {
    console.error('Failed to list invoices:', error);
    return 'Failed to list invoices';
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
