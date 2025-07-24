/* © 2025 Visa.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import { z } from 'zod';
import { Tool } from '../tools';
import { VisaContext } from '../types';
import { Context } from '../configuration';
const cybersourceRestApi = require('cybersource-rest-client');


export const getPaymentLinkParameters = (
  context: VisaContext = {} as VisaContext
) => {
  return z.object({
    id: z.string().describe('Payment link ID (required)')
  });
};

export const getPaymentLinkPrompt = (context: VisaContext = {} as VisaContext) => `
This tool will get a specific payment link from Visa Acceptance.
`;


export const getPaymentLink = async (
  visaClient: any,
  context: VisaContext,
  params: z.infer<ReturnType<typeof getPaymentLinkParameters>>
) => {
  try {
    const paymentLinkApiInstance = new cybersourceRestApi.PaymentLinksApi(visaClient.configuration, visaClient.visaApiClient);
    
    const result = await new Promise((resolve, reject) => {
      paymentLinkApiInstance.getPaymentLink(params.id, (error: any, data: any) => {
        if (error) {
          reject(error);
        } else {
          resolve(data);
        }
      });
    });
    
    return result;
  } catch (error) {
    return 'Failed to get payment link';
  }
};

const tool = (context: VisaContext): Tool => ({
  method: 'get_payment_link',
  name: 'Get Payment Link',
  description: getPaymentLinkPrompt(context),
  parameters: getPaymentLinkParameters(context),
  actions: {
    paymentLinks: {
      read: true,
    },
  },
  execute: getPaymentLink,
});

export default tool;
