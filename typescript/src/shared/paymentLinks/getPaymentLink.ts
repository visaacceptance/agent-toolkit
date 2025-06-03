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
  description: 'Get details of a payment link by its ID.',
  parameters: getPaymentLinkParameters(context),
  actions: {
    paymentLinks: {
      read: true,
    },
  },
  execute: getPaymentLink,
});

export default tool;