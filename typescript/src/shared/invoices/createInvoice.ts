import { z } from 'zod';
import { Tool } from '../tools';
import { VisaContext } from '../types';
import { Context } from '../configuration';
const cybersourceRestApi = require('cybersource-rest-client');

export const createInvoiceParameters = (
  context: VisaContext = {} as VisaContext
): z.AnyZodObject => {
  return z.object({
    invoice_number: z.string().describe('Invoice number identifier (required)'),
    totalAmount: z.string().describe('Invoice total amount e.g. "100.00" (required)'),
    currency: z.string().describe('Invoice currency code e.g. "USD" (required)'),
    customer_name: z.string().optional().describe('Customer name (optional)'),
    customer_email: z.string().optional().describe('Customer email (optional)'),
    invoiceInformation: z.object({
      description: z.string().optional().describe('Invoice description (optional)'),
      sendImmediately: z.boolean().optional().describe('Whether to send the invoice immediately (optional)'),
      deliveryMode: z.string().optional().describe('Delivery mode e.g. "email" (optional)')
    }).optional()
  });
};

export const createInvoicePrompt = (context: VisaContext = {} as VisaContext) => `
This tool will create an invoice in Cybersource.

Create an invoice.
`;

export const createInvoice = async (
  visaClient: any,
  context: VisaContext,
  params: z.infer<ReturnType<typeof createInvoiceParameters>>
) => {
  try {
    console.error('Creating invoice with parameters:', JSON.stringify(params, null, 2));
    
    // Create the InvoicesApi instance with the client configuration
    const invoiceApiInstance = new cybersourceRestApi.InvoicesApi(visaClient.configuration, visaClient.visaApiClient);
    
    // Prepare the request body according to Cybersource API requirements
    const requestObj = {
      customerInformation: {
        name: params.customer_name || (params.customerInformation?.name), // Use provided name or default
        email: params.customer_email || (params.customerInformation?.email) // Use provided email or default
      },
      orderInformation: {
        amountDetails: {
          totalAmount: params.totalAmount,
          currency: params.currency
        }
      },
      invoiceInformation: {
        description: params.invoiceInformation?.description,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Default due date (30 days from now)
        invoiceNumber: params.invoice_number,
        sendImmediately: params.invoiceInformation?.sendImmediately !== undefined ? params.invoiceInformation.sendImmediately : true,
        deliveryMode: params.invoiceInformation?.deliveryMode || 'email'
      }
    };
    
    console.error('Sending request to Cybersource API:', JSON.stringify(requestObj, null, 2));
    
    // Call the Cybersource API to create an invoice
    const result = await new Promise((resolve, reject) => {
      invoiceApiInstance.createInvoice(requestObj, (error: any, data: any) => {
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
      `Failed to create invoice: ${error.message}` :
      'Failed to create invoice: Unknown error';
    
    console.error('Error in createInvoice tool:', errorMessage);
    
    // Return error diagnostic information
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