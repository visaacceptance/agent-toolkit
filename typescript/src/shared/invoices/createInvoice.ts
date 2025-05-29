import { z } from 'zod';
import { Tool } from '../tools';
import { VisaContext } from '../types';
import { Context } from '../configuration';
import { maskInvoiceCustomerInfo } from '../utils/masking';
const cybersourceRestApi = require('cybersource-rest-client');

export const createInvoiceParameters = (
  context: VisaContext = {} as VisaContext
) => {
  return z.object({
    invoice_number: z.string().describe('Unique invoice number (letters & numbers only, <20 chars)'),
    totalAmount: z.string().describe('Invoice total amount e.g. "100.00"'),
    currency: z.string().describe('Invoice currency code e.g. "USD"'),
    customer_name: z.string().optional().describe('Customer name'),
    customer_email: z.string().optional().describe('Customer email'),
    invoiceInformation: z.object({
      description: z.string().describe('Extremely short invoice description (max 50 characters)'),
      dueDate: z.string().describe('Due date in YYYY-MM-DD format'),
      sendImmediately: z.boolean().optional().describe('Whether to send the invoice immediately'),
      deliveryMode: z.string().optional().describe('Delivery mode e.g. "email"')
    }).required().describe('Invoice information object'),
  });
};

export const createInvoicePrompt = (context: VisaContext = {} as VisaContext) => `
This tool will create an invoice in Visa Acceptance.
`;

export const createInvoice = async (
  visaClient: any,
  context: VisaContext,
  params: z.infer<ReturnType<typeof createInvoiceParameters>>
) => {
  try {
    console.error('Creating invoice with parameters:', JSON.stringify(params, null, 2));
    console.error('Creating invoice with parameters:', JSON.stringify(params, null, 2));
    
    const invoiceApiInstance = new cybersourceRestApi.InvoicesApi(visaClient.configuration, visaClient.visaApiClient);
    
    const requestObj = {
      merchantId: context.merchantId, 
      customerInformation: {
        name: params.customer_name || (params?.customer_name), 
        email: params.customer_email || (params?.customer_email) 
      },
      orderInformation: {
        amountDetails: {
          totalAmount: params.totalAmount,
          currency: params.currency
        }
      },
      invoiceInformation: {
        description: params.invoiceInformation?.description,
        dueDate: params.invoiceInformation?.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Use provided due date or default to 30 days from now
        invoiceNumber: params.invoice_number,
        sendImmediately: params.invoiceInformation?.sendImmediately !== undefined ? params.invoiceInformation.sendImmediately : true,
        deliveryMode: params.invoiceInformation?.deliveryMode || 'email'
      }
    };
    
    console.error('Sending request to Cybersource API:', JSON.stringify(requestObj, null, 2));
    
    const result = await new Promise((resolve, reject) => {
      invoiceApiInstance.createInvoice(requestObj, (error: any, data: any) => {
        if (error) {
          console.error('Error from Cybersource API:', error);
          console.error('Error from Cybersource API:', error);
          reject(error);
        } else {
          console.error('Response from Cybersource API:', JSON.stringify(data, null, 2));
          console.error('Response from Cybersource API:', JSON.stringify(data, null, 2));
          resolve(data);
        }
      });
    });
    
    const maskedResult = maskInvoiceCustomerInfo(result);
    
    return maskedResult;
  } catch (error) {
    const errorMessage = error instanceof Error ?
      `Failed to create invoice: ${error.message}` :
      'Failed to create invoice: Unknown error';
    console.error('Error in createInvoice tool:', errorMessage);
    return {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    };
  }
};

const tool = (context: VisaContext): Tool => ({
  method: 'create_invoice',
  name: 'Create Invoice',
  description: createInvoicePrompt(context),
  parameters: createInvoiceParameters(context),
  actions: {
    invoices: {
      create: true,
    },
  },
  execute: createInvoice,
});

export default tool;