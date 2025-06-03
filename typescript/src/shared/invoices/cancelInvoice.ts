import { z } from 'zod';
import { Tool } from '../tools';
import { VisaContext } from '../types';
import { Context } from '../configuration';
import { maskInvoiceCustomerInfo } from '../utils/masking';
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