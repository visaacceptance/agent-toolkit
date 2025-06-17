/* © 2025 Visa.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
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
