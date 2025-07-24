/* © 2025 Visa.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import { z } from 'zod';
import { Tool } from '../tools';
import { VisaContext } from '../types';
import { Context } from '../configuration';
import { maskInvoiceCustomerInfo } from '../utils/util';
const cybersourceRestApi = require('cybersource-rest-client');
export const cancelInvoiceParameters = (
  context: VisaContext = {} as VisaContext
) => {
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
    const invoiceApiInstance = new cybersourceRestApi.InvoicesApi(visaClient.configuration, visaClient.visaApiClient);
    
    const result = await new Promise((resolve, reject) => {
      invoiceApiInstance.performCancelAction(params.invoice_id, (error: any, data: any, response: any) => {
        if (error) {
          reject(error);
        } else {
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
    return 'Failed to cancel invoice';
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
