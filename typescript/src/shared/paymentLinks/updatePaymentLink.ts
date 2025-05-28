import { z } from 'zod';
import { Tool } from '../tools';
import { VisaContext } from '../types';
import { Context } from '../configuration';
import { maskPII } from '../utils/masking';
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

Update an existing payment link by its ID.
`;

export const updatePaymentLink = async (
  visaClient: any,
  context: VisaContext,
  params: z.infer<ReturnType<typeof updatePaymentLinkParameters>>
) => {
  try {
    console.error('Updating payment link with parameters:', JSON.stringify(params, null, 2));
    
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
    
    if (context.merchantId) {
      const clientReferenceInformation = new cybersourceRestApi.Invoicingv2invoicesClientReferenceInformation();
      clientReferenceInformation.code = context.merchantId;
      requestObj.clientReferenceInformation = clientReferenceInformation;
    }
    
    console.error('Sending request to Cybersource API:', JSON.stringify(requestObj, null, 2));
    
    const result = await new Promise((resolve, reject) => {
      paymentLinkApiInstance.updatePaymentLink(id, requestObj, (error: any, data: any) => {
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
      `Failed to update payment link: ${error.message}` :
      'Failed to update payment link: Unknown error';
    
    console.error('Error in updatePaymentLink tool:', errorMessage);
    
    return {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    };
  }
};

const tool = (context: VisaContext): Tool => ({
  method: 'update_payment_link',
  name: 'Update Payment Link',
  description: 'Update an existing payment link by its ID.',
  parameters: updatePaymentLinkParameters(context),
  actions: {
    paymentLinks: {
      update: true,
    },
  },
  execute: updatePaymentLink,
});

export default tool;