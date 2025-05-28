import { z } from 'zod';
import { Tool } from '../tools';
import { VisaContext } from '../types';
import { Context } from '../configuration';
import { maskInvoiceCustomerInfo } from '../utils/masking';
const cybersourceRestApi = require('cybersource-rest-client');

export const updateInvoiceParameters = (
  context: VisaContext = {} as VisaContext
) => {
  return z.object({
    id: z.string().describe('Invoice ID (required)'),
    customerInformation: z.object({
      email: z.string().optional().describe('Customer email (optional)'),
      name: z.string().optional().describe('Customer name (optional)')
    }).describe('Customer information object (required even if properties are optional)'),
    invoiceInformation: z.object({
      description: z.string().optional().describe('Invoice description (required)'),
      dueDate: z.string().optional().describe('Due date (required)'),
      allowPartialPayments: z.boolean().optional().describe('Whether to allow partial payments (optional)'),
      deliveryMode: z.string().optional().describe('Delivery mode (optional)')
    }).describe('Invoice information object (required even if properties are optional)'),
    orderInformation: z.object({
      amountDetails: z.object({
        totalAmount: z.string().describe('Total amount (required)'),
        currency: z.string().describe('Currency code (required)'),
        discountAmount: z.string().optional().describe('Discount amount (optional)'),
        discountPercent: z.number().optional().describe('Discount percent (optional)'),
        subAmount: z.number().optional().describe('Sub amount (optional)'),
        minimumPartialAmount: z.number().optional().describe('Minimum partial amount (optional)')
      }).describe('Amount details object (required with totalAmount and currency)')
    }).describe('Order information object (required)')
  });
};

export const updateInvoicePrompt = (context: VisaContext = {} as VisaContext) => `
This tool will update an invoice in Visa Acceptance.

IMPORTANT: All nested objects (customerInformation, invoiceInformation, orderInformation) are required, even if some of their properties are optional.

Example usage:
{
  "id": "INVOICE-ID-123",
  "customerInformation": {
    "name": "Updated Customer Name",
    "email": "updated.email@example.com"
  },
  "invoiceInformation": {
    "description": "Updated invoice description",
    "dueDate": "2025-06-17",
    "allowPartialPayments": false,
    "deliveryMode": "email"
  },
  "orderInformation": {
    "amountDetails": {
      "totalAmount": "75.00",
      "currency": "USD"
    }
  }
}
`;

export const updateInvoice = async (
  visaClient: any,
  context: VisaContext,
  params: z.infer<ReturnType<typeof updateInvoiceParameters>>
) => {
  const { id, ...updateData } = params;
  
  try {
    const invoiceApiInstance = new cybersourceRestApi.InvoicesApi(visaClient.configuration, visaClient.visaApiClient);
    
    if (!updateData.customerInformation || !updateData.invoiceInformation || !updateData.orderInformation) {
      return {
        error: 'Failed to update invoice: Missing required nested objects. Please ensure customerInformation, invoiceInformation, and orderInformation are all included.'
      };
    }
    
    if (!updateData.orderInformation.amountDetails ||
        !updateData.orderInformation.amountDetails.totalAmount ||
        !updateData.orderInformation.amountDetails.currency) {
      return {
        error: 'Failed to update invoice: Missing required fields in orderInformation.amountDetails. Both totalAmount and currency are required.'
      };
    }
    
    const requestObj = {
      customerInformation: updateData.customerInformation,
      orderInformation: updateData.orderInformation,
      invoiceInformation: updateData.invoiceInformation
    };
    
    const result = await new Promise((resolve, reject) => {
      invoiceApiInstance.updateInvoice(id, requestObj, (error: any, data: any) => {
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
    let errorMessage = 'Failed to update invoice: Unknown error';
    
    if (error instanceof Error) {
      errorMessage = `Failed to update invoice: ${error.message}`;
      
      if (error.message.includes('not found')) {
        errorMessage = `Failed to update invoice: Invoice with ID '${id}' not found`;
      } else if (error.message.includes('validation')) {
        errorMessage = `Failed to update invoice: Validation error in request data. Please check all required fields.`;
      } else if (error.message.includes('authentication') || error.message.includes('unauthorized')) {
        errorMessage = `Failed to update invoice: Authentication error. Please check API credentials.`;
      }
    }
    
    console.error('Error in updateInvoice tool:', errorMessage);
    
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