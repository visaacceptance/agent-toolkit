import { z } from 'zod';
import { Tool } from '../tools';
import { VisaContext } from '../types';
import { Context } from '../configuration';
import { maskPII } from '../utils/masking';
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

Get details of a payment link by its ID.
`;

export const getPaymentLink = async (
  visaClient: any,
  context: VisaContext,
  params: z.infer<ReturnType<typeof getPaymentLinkParameters>>
) => {
  try {
    console.error('Getting payment link with ID:', params.id);
    
    const paymentLinkApiInstance = new cybersourceRestApi.PaymentLinksApi(visaClient.configuration, visaClient.visaApiClient);
    
    console.error('Sending request to Cybersource API to get payment link with ID:', params.id);
    
    const result = await new Promise((resolve, reject) => {
      paymentLinkApiInstance.getPaymentLink(params.id, (error: any, data: any) => {
        if (error) {
          console.error('Error from Cybersource API:', error);
          reject(error);
        } else {
          console.error('Response from Cybersource API:', JSON.stringify(data, null, 2));
          resolve(data);
        }
      });
    });
    
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ?
      `Failed to get payment link: ${error.message}` :
      'Failed to get payment link: Unknown error';
    
    console.error('Error in getPaymentLink tool:', errorMessage);
    
    return {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    };
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