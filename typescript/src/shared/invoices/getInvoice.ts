/* © 2025 Visa.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
/* START GENAI */
import { z } from 'zod';
import { Tool } from '../tools';
import { VisaContext } from '../types';
import { Context } from '../configuration';
import { maskInvoiceCustomerInfo } from '../utils/util';
const cybersourceRestApi = require('cybersource-rest-client');
export const getInvoiceParameters = (
  context: VisaContext = {} as VisaContext
) => {
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
    const invoiceApiInstance = new cybersourceRestApi.InvoicesApi(visaClient.configuration, visaClient.visaApiClient);
    
    const result = await new Promise((resolve, reject) => {
      invoiceApiInstance.getInvoice(params.id, (error: any, data: any) => {
        if (error) {
          reject(error);
        } else {
          resolve(data);
        }
      });
    });
    
    const maskedResult = maskInvoiceCustomerInfo(result);
    return maskedResult;
  } catch (error) {
    return 'Failed to get invoice';
  }
};

const tool = (context: VisaContext): Tool => ({
  method: 'get_invoice',
  name: 'Get Invoice',
  description: getInvoicePrompt(context),
  parameters: getInvoiceParameters(context),
  actions: {
    invoices: {
      read: true,
    },
  },
  execute: getInvoice,
});

export default tool;
/* END GENAI */