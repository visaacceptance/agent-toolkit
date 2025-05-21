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

export const createPaymentLinkParameters = (
  context: VisaContext = {} as VisaContext
): z.AnyZodObject => {
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

Create a pay-by-link for a purchase using the new PayByLink code.
`;



export const createPaymentLink = async (
  visaClient: any,
  context: VisaContext,
  params: z.infer<ReturnType<typeof createPaymentLinkParameters>>
) => {
  try {
    console.error('Creating payment link with parameters:', JSON.stringify(params, null, 2));
    
    // Log the client configuration (with sensitive data masked)
    const configCopy = {...visaClient.configuration};
    if (configCopy.merchantsecretKey) configCopy.merchantsecretKey = '***MASKED***';
    console.error('Client configuration:', JSON.stringify(configCopy, null, 2));
    
    // Log the context
    console.error('Context:', JSON.stringify({
      merchantId: context.merchantId,
      apiKeyId: context.apiKeyId ? '***EXISTS***' : '***MISSING***',
      secretKey: context.secretKey ? '***EXISTS***' : '***MISSING***',
      environment: context.environment
    }, null, 2));
    
    // Log the API client details
    console.error('API Client details:');
    console.error('- visaApiClient exists:', !!visaClient.visaApiClient);
    console.error('- visaApiClient type:', typeof visaClient.visaApiClient);
    
    // Check if the API client has authentication methods
    if (visaClient.visaApiClient) {
      console.error('- visaApiClient methods:', Object.keys(visaClient.visaApiClient).filter(key => typeof visaClient.visaApiClient[key] === 'function'));
      
      // Check if the API client has an authentications property
      if (visaClient.visaApiClient.authentications) {
        console.error('- authentications:', Object.keys(visaClient.visaApiClient.authentications));
      } else {
        console.error('- authentications property not found on visaApiClient');
      }
      
      // Check if the API client has authentication methods
      if (typeof visaClient.visaApiClient.setApiKey === 'function') {
        console.error('- setApiKey method found');
      }
      if (typeof visaClient.visaApiClient.setBasicAuth === 'function') {
        console.error('- setBasicAuth method found');
      }
    }
    
    // Try to manually set up HTTP signature authentication
    try {
      console.error('Attempting to manually set up HTTP signature authentication...');
      if (visaClient.visaApiClient && typeof visaClient.visaApiClient.setConfiguration === 'function') {
        visaClient.visaApiClient.setConfiguration(visaClient.configuration);
        console.error('- Manually set configuration on visaApiClient');
      }
    } catch (error) {
      console.error('Error setting up authentication:', error);
    }
    
    const paymentLinkApiInstance = new cybersourceRestApi.PaymentLinksApi(visaClient.configuration, visaClient.visaApiClient);
    
    const processingInformation = new cybersourceRestApi.Iplv2paymentlinksProcessingInformation(params.linkType, params.requestPhone, params.requestShipping);
    
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
    
    console.error('Sending request to Cybersource API:', JSON.stringify(requestObj, null, 2));

    console.error('Creating payment link with API instance...');
    
    // Inspect the API instance
    console.error('PaymentLinksApi instance details:');
    console.error('- apiClient exists:', !!paymentLinkApiInstance.apiClient);
    console.error('- apiClient.authentications exists:', !!paymentLinkApiInstance.apiClient?.authentications);
    
    // Check authentication details
    if (paymentLinkApiInstance.apiClient?.authentications) {
      const authTypes = Object.keys(paymentLinkApiInstance.apiClient.authentications);
      console.error('- Authentication types:', authTypes);
      
      // Check HTTP signature auth if it exists
      const httpSignatureAuth = paymentLinkApiInstance.apiClient.authentications['http_signature'];
      if (httpSignatureAuth) {
        console.error('- HTTP Signature auth details:');
        console.error('  - keyId exists:', !!httpSignatureAuth.keyId);
        console.error('  - secretKey exists:', !!httpSignatureAuth.secretKey);
        console.error('  - merchantId exists:', !!httpSignatureAuth.merchantId);
      }
    }
    
    const result = await new Promise((resolve, reject) => {
      console.error('Calling createPaymentLink API method...');
      paymentLinkApiInstance.createPaymentLink(requestObj, (error: any, data: any) => {
        if (error) {
          console.error('Error from Cybersource API:', error);
          
          // More detailed error inspection
          if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response headers:', JSON.stringify(error.response.header, null, 2));
            console.error('Response body:', error.response.text);
            
            try {
              const errorBody = JSON.parse(error.response.text);
              console.error('Parsed error body:', JSON.stringify(errorBody, null, 2));
            } catch (e) {
              console.error('Could not parse error body as JSON');
            }
          }
          
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
      `Failed to create payment link: ${error.message}` :
      'Failed to create payment link: Unknown error';
    
    console.error('Error in createPaymentLink tool:', errorMessage);
    
    return {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    };
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