import { z } from 'zod';
import { Tool } from '../tools';
import { VisaContext } from '../types';
import { Context } from '../configuration';
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
    
    if (context.merchantId) {
      const clientReferenceInformation = new cybersourceRestApi.Invoicingv2invoicesClientReferenceInformation();
      clientReferenceInformation.code = context.merchantId;
      requestObj.clientReferenceInformation = clientReferenceInformation;
    }
    
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
  description: 'Create a pay-by-link for a purchase for 499 usd for generating purchaseNumber',
  parameters: createPaymentLinkParameters(context),
  actions: {
    paymentLinks: {
      create: true,
    },
  },
  execute: createPaymentLink,
});

export default tool;