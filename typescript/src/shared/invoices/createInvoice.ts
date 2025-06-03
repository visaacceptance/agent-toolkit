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
    const invoiceApiInstance = new cybersourceRestApi.InvoicesApi(visaClient.configuration, visaClient.visaApiClient);
    
    const requestObj = {
      merchantId: context.merchantId,
      customerInformation: {
        name: params.customer_name,
        email: params.customer_email
      },
      orderInformation: {
        amountDetails: {
          totalAmount: params.totalAmount,
          currency: params.currency
        }
      },
      invoiceInformation: {
        description: params.invoiceInformation?.description,
        dueDate: params.invoiceInformation?.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        invoiceNumber: params.invoice_number,
        sendImmediately: params.invoiceInformation?.sendImmediately !== undefined ? params.invoiceInformation.sendImmediately : true,
        deliveryMode: params.invoiceInformation?.deliveryMode || 'email'
      }
    };
    
    const result = await new Promise((resolve, reject) => {
      invoiceApiInstance.createInvoice(requestObj, (error: any, data: any) => {
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
    return 'Failed to create invoice';
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