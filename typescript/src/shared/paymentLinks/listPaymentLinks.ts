/* © 2025 Visa.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
import { z } from 'zod';
import { Tool } from '../tools';
import { VisaContext } from '../types';
import { Context } from '../configuration';
import { maskPII } from '../utils/masking';
const cybersourceRestApi = require('cybersource-rest-client');

export const listPaymentLinksParameters = (
  context: VisaContext = {} as VisaContext
) => {
  return z.object({
    offset: z.number().describe('Pagination offset (required)'),
    limit: z.number().describe('Pagination limit (required)'),
    status: z.string().optional().describe('Filter by status (optional)')
  });
};

export const listPaymentLinksPrompt = (context: VisaContext = {} as VisaContext) => `
This tool will list payment links from Visa Acceptance.
`;

export const listPaymentLinks = async (
  visaClient: any,
  context: VisaContext,
  params: z.infer<ReturnType<typeof listPaymentLinksParameters>>
) => {
  try {
    const paymentLinkApiInstance = new cybersourceRestApi.PaymentLinksApi(visaClient.configuration, visaClient.visaApiClient);
    
    const opts: { status?: string } = {};
    if (params.status) {
      opts.status = params.status;
    }
    
    const result = await new Promise((resolve, reject) => {
      paymentLinkApiInstance.getAllPaymentLinks(
        params.offset,
        params.limit,
        opts,
        (error: any, data: any) => {
          if (error) {
            reject(error);
          } else {
            resolve(data);
          }
        }
      );
    });
    
    return result;
  } catch (error) {
    return 'Failed to list payment links';
  }
};

const tool = (context: VisaContext): Tool => ({
  method: 'list_payment_links',
  name: 'List Payment Links',
  description: 'Get a list of payment links with optional filtering by status.',
  parameters: listPaymentLinksParameters(context),
  actions: {
    paymentLinks: {
      read: true,
    },
  },
  execute: listPaymentLinks,
});

export default tool;