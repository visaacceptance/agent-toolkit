/* © 2025 Visa.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
import { z } from 'zod';
import { Tool } from '../tools';
import { VisaContext } from '../types';
import { Context } from '../configuration';
import { maskInvoiceCustomerInfo } from '../utils/masking';
const cybersourceRestApi = require('cybersource-rest-client');

export const updateInvoicePrompt = (context: VisaContext = {} as VisaContext) => `
This tool will update an invoice in Visa Acceptance.
`;

export const updateInvoice = async (
  visaClient: any,
  context: VisaContext,
  params: z.infer<ReturnType<typeof updateInvoiceParameters>>
) => {
  try {
    const { id, ...updateData } = params;
    const invoiceApiInstance = new cybersourceRestApi.InvoicesApi(visaClient.configuration, visaClient.visaApiClient);
    
    if (!updateData.customerInformation || !updateData.invoiceInformation || !updateData.orderInformation) {
      return 'Failed to update invoice: Missing required nested objects';
    }
    
    if (!updateData.orderInformation.amountDetails ||
        !updateData.orderInformation.amountDetails.totalAmount ||
        !updateData.orderInformation.amountDetails.currency) {
      return 'Failed to update invoice: Missing required fields in orderInformation.amountDetails';
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
    return 'Failed to update invoice';
  }
};

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