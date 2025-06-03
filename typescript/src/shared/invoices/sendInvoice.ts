import { z } from 'zod';
import { Tool } from '../tools';
import { VisaContext } from '../types';
import { Context } from '../configuration';
import { maskInvoiceCustomerInfo } from '../utils/masking';
const cybersourceRestApi = require('cybersource-rest-client');

export const sendInvoiceParameters = (
  context: VisaContext = {} as VisaContext
) => {
  return z.object({
    invoice_id: z.string().describe('Invoice ID (required)')
  });
};

export const sendInvoicePrompt = (context: VisaContext = {} as VisaContext) => `
This tool will send an invoice to the customer from Visa Acceptance.
`;

export const sendInvoice = async (
  visaClient: any,
  context: VisaContext,
  params: z.infer<ReturnType<typeof sendInvoiceParameters>>
) => {
  try {
    const invoiceApiInstance = new cybersourceRestApi.InvoicesApi(visaClient.configuration, visaClient.visaApiClient);
    
    const result = await new Promise((resolve, reject) => {
      invoiceApiInstance.performSendAction(params.invoice_id, (error: any, data: any, response: any) => {
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
    return 'Failed to send invoice';
  }
};

const tool = (context: VisaContext): Tool => ({
  method: 'send_invoice',
  name: 'Send Invoice',
  description: sendInvoicePrompt(context),
  parameters: sendInvoiceParameters(context),
  actions: {
    invoices: {
      update: true,
    },
  },
  execute: sendInvoice,
});

export default tool;