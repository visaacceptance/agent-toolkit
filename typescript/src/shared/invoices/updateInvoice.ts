import { z } from 'zod';
import { Tool } from '../tools';
import { VisaContext } from '../types';
import { Context } from '../configuration';
const cybersourceRestApi = require('cybersource-rest-client');

export const updateInvoiceParameters = (
  context: VisaContext = {} as VisaContext
): z.AnyZodObject => {
  return z.object({
    id: z.string().describe('Invoice ID (required)'),
    customerInformation: z.object({
      email: z.string().optional().describe('Customer email (optional)'),
      name: z.string().optional().describe('Customer name (optional)')
    }),
    invoiceInformation: z.object({
      description: z.string().optional().describe('Invoice description (optional)'),
      dueDate: z.string().optional().describe('Due date (optional)'),
      allowPartialPayments: z.boolean().optional().describe('Whether to allow partial payments (optional)'),
      deliveryMode: z.string().optional().describe('Delivery mode (optional)')
    }),
    orderInformation: z.object({
      amountDetails: z.object({
        totalAmount: z.string().describe('Total amount (required)'),
        currency: z.string().describe('Currency code (required)'),
        discountAmount: z.string().optional().describe('Discount amount (optional)'),
        discountPercent: z.number().optional().describe('Discount percent (optional)'),
        subAmount: z.number().optional().describe('Sub amount (optional)'),
        minimumPartialAmount: z.number().optional().describe('Minimum partial amount (optional)')
      })
    })
  });
};

export const updateInvoicePrompt = (context: VisaContext = {} as VisaContext) => `
This tool will update an invoice in Visa Acceptance.
`;

export const updateInvoice = async (
  visaClient: any,
  context: VisaContext,
  params: z.infer<ReturnType<typeof updateInvoiceParameters>>
) => {
  try {
    // Create the InvoicesApi instance with the client configuration
    const invoiceApiInstance = new cybersourceRestApi.InvoicesApi(visaClient.configuration, visaClient.visaApiClient);
    
    // Extract the ID
    const { id, ...updateData } = params;
    
    // Prepare the request body according to Cybersource API requirements
    const requestObj = {
      customerInformation: updateData.customerInformation,
      orderInformation: updateData.orderInformation,
      invoiceInformation: updateData.invoiceInformation
    };
    
    // Call the Cybersource API to update an invoice
    const result = await new Promise((resolve, reject) => {
      invoiceApiInstance.updateInvoice(id, requestObj, (error: any, data: any) => {
        if (error) {
          reject(error);
        } else {
          resolve(data);
        }
      });
    });
    
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ?
      `Failed to update invoice: ${error.message}` :
      'Failed to update invoice: Unknown error';
    
    console.error('Error in updateInvoice tool:', errorMessage);
    
    // Return error diagnostic information
    return {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    };
  }
};

const tool = (context: VisaContext): Tool => ({
  method: 'update_invoice',
  name: 'Update Invoice',
  description: updateInvoicePrompt(context),
  parameters: updateInvoiceParameters(context),
  actions: {
    invoices: {
      update: true,
    },
  },
  execute: updateInvoice,
});

export default tool;