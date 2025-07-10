/* © 2025 Visa.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
/* START GENAI */
import { z } from 'zod';
import { Tool } from '../tools';
import { VisaContext } from '../types';
import { Context } from '../configuration';
import { setDeveloperId } from '../utils/util';
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

export const createPaymentLinkParameters = (
  context: VisaContext = {} as VisaContext
) => {
  return z.object({
    linkType: z.string().describe('Type of payment link (PURCHASE OR DONATION)'),
    purchaseNumber: z.string().describe('Unique alphanumeric id, no special chararacters for the purchase less than 20 characters'),
    currency: z.string().describe('Currency code e.g. "USD" (Required)'),
    totalAmount: z.string().optional().describe('Total payment amount e.g. "100.00"'),
    requestPhone: z.boolean().optional().default(false).describe('Request phone number from customer'),
    requestShipping: z.boolean().optional().default(false).describe('Request shipping address from customer'),
    clientReferenceCode: z.string().optional().describe('Custom client reference code for the transaction'),
    lineItems: z.array(
      z.object({
        productName: z.string().describe('Name of the product'),
        productSKU: z.string().optional().describe('Product SKU identifier'),
        productDescription: z.string().optional().describe('Product description'),
        quantity: z.string().describe('Quantity of the product'),
        unitPrice: z.string().describe('Unit price of the product')
      })
    ).describe('Line items in the purchase')
  });
};

export const createPaymentLinkPrompt = (context: VisaContext = {} as VisaContext) => `
This tool will create a payment link in Visa Acceptance.
`;

export const createPaymentLink = async (
  visaClient: any,
  context: VisaContext,
  params: z.infer<ReturnType<typeof createPaymentLinkParameters>>
) => {
  try {
    const paymentLinkApiInstance = new cybersourceRestApi.PaymentLinksApi(visaClient.configuration, visaClient.visaApiClient);
    
    const processingInformation = new cybersourceRestApi.Iplv2paymentlinksProcessingInformation(
      params.linkType, 
      params.requestPhone, 
      params.requestShipping
    );
    
    const purchaseInformation = new cybersourceRestApi.Iplv2paymentlinksPurchaseInformation(params.purchaseNumber);
    
    const amountDetails = new cybersourceRestApi.Iplv2paymentlinksOrderInformationAmountDetails(params.currency);
    amountDetails.totalAmount = params.totalAmount;
    
    const lineItems = params.lineItems.map((item: LineItem) => {
      const lineItem = new cybersourceRestApi.Iplv2paymentlinksOrderInformationLineItems(item.productName);
      lineItem.productSku = item.productSKU;
      lineItem.productDescription = item.productDescription;
      lineItem.quantity = parseInt(item.quantity, 10);
      lineItem.unitPrice = item.unitPrice;
      return lineItem;
    });
    
    const orderInformation = new cybersourceRestApi.Iplv2paymentlinksOrderInformation(amountDetails, lineItems);
    
    const requestObj = new cybersourceRestApi.CreatePaymentLinkRequest(
      processingInformation,
      purchaseInformation,
      orderInformation
    );
    const clientReferenceInformation = new cybersourceRestApi.Invoicingv2invoicesClientReferenceInformation();
    if (params.clientReferenceCode) {
      clientReferenceInformation.code = params.clientReferenceCode;
    } else if (context.merchantId) {
      clientReferenceInformation.code = context.merchantId;
    }
    requestObj.clientReferenceInformation = clientReferenceInformation;

    
    // Initialize partner object if it doesn't exist
    requestObj.clientReferenceInformation.partner = {};
    
    // Set the developer ID based on the context mode
    setDeveloperId(requestObj, context);
    
    const result = await new Promise((resolve, reject) => {
      paymentLinkApiInstance.createPaymentLink(requestObj, (error: any, data: any) => {
        if (error) {
          reject(error);
        } else {
          resolve(data);
        }
      });
    });
    
    return result;
  } catch (error) {
    return 'Failed to create payment link';
  }
};



const tool = (context: VisaContext): Tool => ({
  method: 'create_payment_link',
  name: 'Create Payment Link',
  description: createPaymentLinkPrompt(context),
  parameters: createPaymentLinkParameters(context),
  actions: {
    paymentLinks: {
      create: true,
    },
  },
  execute: createPaymentLink,
});

export default tool;
/* END GENAI */