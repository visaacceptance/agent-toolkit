/* © 2025 Visa.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import { z } from 'zod';
import { Tool } from '../tools';
import { VisaContext } from '../types';
import { Context } from '../configuration';
import { maskPII } from '../utils/util';
const cybersourceRestApi = require('cybersource-rest-client');

/**
 * Interface for payment link line items
 */
interface LineItem {
  productName: string;
  productSKU?: string;
  productDescription?: string;
  quantity: string;
  unitPrice: string;
}

export const updatePaymentLinkParameters = (
  context: VisaContext = {} as VisaContext
) => {
  return z.object({
    id: z.string().describe('Payment link ID (required)'),
    linkType: z.string().optional().describe('Type of payment link (PURCHASE OR DONATION)'),
    purchaseNumber: z.string().optional().describe('Unique identifier for the purchase'),
    currency: z.string().optional().describe('Currency code e.g. "USD"'),
    totalAmount: z.string().optional().describe('Total payment amount e.g. "100.00"'),
    requestPhone: z.boolean().optional().describe('Request phone number from customer'),
    requestShipping: z.boolean().optional().describe('Request shipping address from customer'),
    clientReferenceCode: z.string().optional().describe('Custom client reference code for the transaction'),
    lineItems: z.array(
      z.object({
        productName: z.string().describe('Name of the product'),
        productSKU: z.string().optional().describe('Product SKU identifier'),
        productDescription: z.string().optional().describe('Product description'),
        quantity: z.string().describe('Quantity of the product'),
        unitPrice: z.string().describe('Unit price of the product')
      })
    ).optional().describe('Line items in the purchase'),
    expirationDays: z.number().optional().describe('Number of days the link remains valid')
  });
};

export const updatePaymentLinkPrompt = (context: VisaContext = {} as VisaContext) => `
This tool will update a payment link in Visa Acceptance.
`;

export const updatePaymentLink = async (
  visaClient: any,
  context: VisaContext,
  params: z.infer<ReturnType<typeof updatePaymentLinkParameters>>
) => {
  try {
    const paymentLinkApiInstance = new cybersourceRestApi.PaymentLinksApi(visaClient.configuration, visaClient.visaApiClient);
    
    const { id, ...updateParams } = params;
    
    let expirationDate;
    if (params.expirationDays) {
      expirationDate = new Date(Date.now() + params.expirationDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    }
    
    /**
     * Create the SDK model objects for the payment link update
     */
    let processingInformation;
    if (params.linkType) {
      processingInformation = new cybersourceRestApi.Iplv2paymentlinksProcessingInformation(
        params.linkType,
        params.requestPhone,
        params.requestShipping
      );
    }
    
    let purchaseInformation;
    if (params.purchaseNumber) {
      purchaseInformation = new cybersourceRestApi.Iplv2paymentlinksPurchaseInformation(params.purchaseNumber);
    }
    
    let amountDetails;
    let orderInformation;
    if (params.currency) {
      amountDetails = new cybersourceRestApi.Iplv2paymentlinksOrderInformationAmountDetails(params.currency);
      if (params.totalAmount) {
        amountDetails.totalAmount = params.totalAmount;
      }
      
      let lineItems;
      if (params.lineItems && params.lineItems.length > 0) {
        lineItems = params.lineItems.map((item: LineItem) => {
          const lineItem = new cybersourceRestApi.Iplv2paymentlinksOrderInformationLineItems(item.productName);
          lineItem.productSku = item.productSKU;
          lineItem.productDescription = item.productDescription;
          lineItem.quantity = parseInt(item.quantity, 10);
          lineItem.unitPrice = item.unitPrice;
          return lineItem;
        });
        
        orderInformation = new cybersourceRestApi.Iplv2paymentlinksOrderInformation(amountDetails, lineItems);
      } else if (amountDetails) {
        orderInformation = new cybersourceRestApi.Iplv2paymentlinksOrderInformation(amountDetails);
      }
    }
    
    const requestObj = new cybersourceRestApi.UpdatePaymentLinkRequest();
    
    if (processingInformation) {
      requestObj.processingInformation = processingInformation;
    }
    if (purchaseInformation) {
      requestObj.purchaseInformation = purchaseInformation;
    }
    if (orderInformation) {
      requestObj.orderInformation = orderInformation;
    }
    
    const clientReferenceInformation = new cybersourceRestApi.Invoicingv2invoicesClientReferenceInformation();
    if (params.clientReferenceCode) {
      clientReferenceInformation.code = params.clientReferenceCode;
    } else if (context.merchantId) {
      clientReferenceInformation.code = context.merchantId;
    }
    requestObj.clientReferenceInformation = clientReferenceInformation;
    
    const result = await new Promise((resolve, reject) => {
      paymentLinkApiInstance.updatePaymentLink(id, requestObj, (error: any, data: any) => {
        if (error) {
          reject(error);
        } else {
          resolve(data);
        }
      });
    });
    
    return result;
  } catch (error) {
    return 'Failed to update payment link';
  }
};

const tool = (context: VisaContext): Tool => ({
  method: 'update_payment_link',
  name: 'Update Payment Link',
  description: updatePaymentLinkPrompt(context),
  parameters: updatePaymentLinkParameters(context),
  actions: {
    paymentLinks: {
      update: true,
    },
  },
  execute: updatePaymentLink,
});

export default tool;
