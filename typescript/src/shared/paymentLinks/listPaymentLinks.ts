import { z } from 'zod';
import { Tool } from '../tools';
import { VisaContext } from '../types';
import { Context } from '../configuration';
import { maskPII } from '../utils/masking';
const cybersourceRestApi = require('cybersource-rest-client');

export const listPaymentLinksParameters = (
  context: VisaContext = {} as VisaContext
): z.AnyZodObject => {
  return z.object({
    offset: z.number().describe('Pagination offset (required)'),
    limit: z.number().describe('Pagination limit (required)'),
    status: z.string().optional().describe('Filter by status (optional)')
  });
};

export const listPaymentLinksPrompt = (context: VisaContext = {} as VisaContext) => `
This tool will list payment links from Visa Acceptance.

Get a list of payment links with optional filtering by status.
`;

export const listPaymentLinks = async (
  visaClient: any,
  context: VisaContext,
  params: z.infer<ReturnType<typeof listPaymentLinksParameters>>
) => {
  try {
    console.error('Listing payment links with parameters:', JSON.stringify(params, null, 2));
    
    const paymentLinkApiInstance = new cybersourceRestApi.PaymentLinksApi(visaClient.configuration, visaClient.visaApiClient);
    
    console.error('Sending request to Cybersource API to list payment links');
    
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
            console.error('Error from Cybersource API:', error);
            reject(error);
          } else {
            console.error('Response from Cybersource API:', JSON.stringify(data, null, 2));
            resolve(data);
          }
        }
      );
    });
    
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ?
      `Failed to list payment links: ${error.message}` :
      'Failed to list payment links: Unknown error';
    
    console.error('Error in listPaymentLinks tool:', errorMessage);
    
    return {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    };
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