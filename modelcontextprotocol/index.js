//! Final fix for index.js, adding missing bracket on line 480 to close the "update_pay_by_link" definition.

'use strict';

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} = require('@modelcontextprotocol/sdk/types.js');
const cybersourceRestApi = require('cybersource-rest-client');
const dotenv = require('dotenv');
const getConfig = require('./config');
const superagent = require('superagent');
const {
  processPayByLink,
  processPayByLinkGet
} = require('./PayByLink.js'); // Import the new PayByLink functions

dotenv.config();

const CYBERSOURCE_MERCHANT_ID = process.env.CYBERSOURCE_MERCHANT_ID || '';
const CYBERSOURCE_API_KEY_ID = process.env.CYBERSOURCE_API_KEY_ID || '';
const CYBERSOURCE_SECRET_KEY = process.env.CYBERSOURCE_SECRET_KEY || '';
const CYBERSOURCE_USE_TEST_ENV = process.env.CYBERSOURCE_USE_TEST_ENV || 'true';

if ((!CYBERSOURCE_MERCHANT_ID || !CYBERSOURCE_API_KEY_ID || !CYBERSOURCE_SECRET_KEY)) {
  console.error('Error: Missing CyberSource API credentials in environment variables');
  console.error('Please set CYBERSOURCE_MERCHANT_ID, CYBERSOURCE_API_KEY_ID, and CYBERSOURCE_SECRET_KEY');
  process.exit(1);
}

const DEFAULT_CARD_NETWORKS = ['VISA', 'MASTERCARD', 'AMEX'];

async function processRefund(transactionId, amount, currency = 'USD') {
  if (!transactionId) {
    throw new Error('Transaction ID is required');
  }
  try {
    const apiClient = new cybersourceRestApi.ApiClient();
    const configObject = getConfig();
    apiClient.setConfiguration(configObject);

    const requestObj = new cybersourceRestApi.RefundPaymentRequest();
    const clientReferenceInformation = new cybersourceRestApi.Ptsv2paymentsClientReferenceInformation();
    clientReferenceInformation.code = `refund-${Date.now()}`;
    requestObj.clientReferenceInformation = clientReferenceInformation;

    if (amount !== undefined) {
      const orderInformation = new cybersourceRestApi.Ptsv2paymentsOrderInformation();
      const amountDetails = new cybersourceRestApi.Ptsv2paymentsOrderInformationAmountDetails();
      amountDetails.totalAmount = amount.toString();
      amountDetails.currency = currency;
      orderInformation.amountDetails = amountDetails;
      requestObj.orderInformation = orderInformation;
    }

    console.error(`Processing refund for transaction: ${transactionId}`);
    const apiInstance = new cybersourceRestApi.RefundApi(configObject, apiClient);

    return new Promise((resolve, reject) => {
      apiInstance.refundPayment(requestObj, transactionId, (error, data) => {
        if (error) {
          reject(error);
        } else {
          resolve(data);
        }
      });
    });
  } catch (error) {
    console.error('Error processing refund:', error);
    throw error;
  }
}

async function generateCaptureContext(
  merchantId,
  currency = 'USD',
  amount,
  allowedCardNetworks = DEFAULT_CARD_NETWORKS,
  allowedPaymentTypes = ['CLICKTOPAY', 'PANENTRY', 'GOOGLEPAY'],
  country = 'US',
  locale = 'en_US',
  captureMandate = null,
  billTo = null,
  shipTo = null
) {
  if (!merchantId) {
    throw new Error('Merchant ID is required');
  }
  try {
    const apiClient = new cybersourceRestApi.ApiClient();
    const configObject = getConfig();
    apiClient.setConfiguration(configObject);

    const requestObj = new cybersourceRestApi.GenerateUnifiedCheckoutCaptureContextRequest();
    requestObj.targetOrigins = ['https://localhost:8080', 'https://localhost:8081'];
    requestObj.allowedCardNetworks = allowedCardNetworks;
    requestObj.allowedPaymentTypes = allowedPaymentTypes;
    requestObj.clientVersion = '0.23';
    requestObj.country = country;
    requestObj.locale = locale;

    if (captureMandate) {
      requestObj.captureMandate = captureMandate;
    } else {
      requestObj.captureMandate = {
        billingType: 'FULL',
        requestEmail: true,
        requestPhone: true,
        requestShipping: true,
        shipToCountries: ['US', 'GB'],
        showAcceptedNetworkIcons: true
      };
    }

    const orderInformation = new cybersourceRestApi.Upv1capturecontextsOrderInformation();
    const amountDetails = new cybersourceRestApi.Upv1capturecontextsOrderInformationAmountDetails();
    amountDetails.totalAmount = amount !== undefined ? String(amount) : '21.00';
    amountDetails.currency = currency;
    orderInformation.amountDetails = amountDetails;

    if (billTo) {
      const billToInfo = new cybersourceRestApi.Upv1capturecontextsOrderInformationBillTo();
      Object.assign(billToInfo, billTo);
      if (billTo.company) {
        const company = new cybersourceRestApi.Upv1capturecontextsOrderInformationBillToCompany();
        Object.assign(company, billTo.company);
        billToInfo.company = company;
      }
      orderInformation.billTo = billToInfo;
    }

    if (shipTo) {
      const shipToInfo = new cybersourceRestApi.Upv1capturecontextsOrderInformationShipTo();
      Object.assign(shipToInfo, shipTo);
      orderInformation.shipTo = shipToInfo;
    }

    requestObj.orderInformation = orderInformation;
    const apiInstance = new cybersourceRestApi.UnifiedCheckoutCaptureContextApi(configObject, apiClient);

    return new Promise((resolve, reject) => {
      apiInstance.generateUnifiedCheckoutCaptureContext(requestObj, (error, data) => {
        if (error) {
          reject(error);
        } else {
          resolve(data);
        }
      });
    });
  } catch (error) {
    console.error('Error generating capture context:', error);
    throw error;
  }
}

/**
 * Build a JSON body string from user-supplied data and call processPayByLink
 */
function createPaymentLink({ linkType, purchaseNumber, currency, totalAmount, lineItems }) {
  return new Promise((resolve, reject) => {
    const requestBody = {
      processingInformation: {
        linkType
      },
      purchaseInformation: {
        purchaseNumber
      },
      orderInformation: {
        amountDetails: {
          currency,
          totalAmount
        },
        lineItems
      }
    };

    const stringifiedBody = JSON.stringify(requestBody);

    processPayByLink(
      stringifiedBody,
      (err, data, response, status) => {
        if (err) {
          reject(err);
        } else if (status === 0) {
          resolve(data);
        } else {
          reject(new Error('PayByLink get returned error status: ' + status));
        }
      },
      {
        // Optionally override merchant config if needed
      }
    );
  });
}

/**
 * Build a JSON body string from user-supplied data and call updatePayByLink
 */
function updatePaymentLink({ linkId, linkType, currency, totalAmount, lineItems, status }) {
  return new Promise((resolve, reject) => {
    const requestBody = {
      status,
      processingInformation: {
        linkType
      },
      orderInformation: {
        amountDetails: {
          currency,
          totalAmount
        },
        lineItems
      }
    };

    const stringifiedBody = JSON.stringify(requestBody);

    const { updatePayByLink } = require('./PayByLink.js');

    updatePayByLink(linkId, stringifiedBody, (err, data, response, patchStatus) => {
      if (err) {
        reject(err);
      } else if (patchStatus === 0) {
        resolve(data);
      } else {
        reject(new Error('Update pay by link returned an error status: ' + patchStatus));
      }
    }, {
      // Optionally override merchant config if needed
    });
  });
}

class CyberSourceMcpServer {
  constructor() {
    // Instantiate the MCP Server
    this.server = new Server(
      {
        name: 'cybersource',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();

    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  setupToolHandlers() {
    // Provide the list of tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'process_refund',
          description: 'Process a refund for a previous transaction.',
          inputSchema: {
            type: 'object',
            properties: {
              transaction_id: {
                type: 'string',
                description: 'The ID of the transaction to refund'
              },
              amount: {
                type: 'number',
                description: 'Optional amount to refund.' 
              },
              currency: {
                type: 'string',
                description: 'Optional currency code. Defaults to USD.'
              }
            },
            required: ['transaction_id']
          }
        },
        {
          name: 'greeting',
          description: 'Say hi',
          inputSchema: {
            type: 'object',
            properties: {
              greeting: {
                type: 'string',
                description: 'the greeting is the actual message'
              }
            },
            required: []
          }
        },
        {
          name: 'checkout_create_context',
          description: 'Generate a capture context for payment processing.',
          inputSchema: {
            type: 'object',
            properties: {
              merchant_id: {
                type: 'string',
                description: 'Merchant ID for the capture context'
              },
              currency: {
                type: 'string',
                description: 'Currency code, defaults to USD'
              },
              amount: {
                type: 'number',
                description: 'Amount for the transaction.'
              },
              allowed_card_networks: {
                type: 'array',
                items: { type: 'string' }
              },
              allowed_payment_types: {
                type: 'array',
                items: { type: 'string' }
              },
              country: {
                type: 'string'
              },
              locale: {
                type: 'string'
              },
              capture_mandate: {
                type: 'object'
              },
              bill_to: {
                type: 'object'
              },
              ship_to: {
                type: 'object'
              }
            },
            required: ['merchant_id']
          }
        },
        {
          name: 'create-payment-link',
          description: 'Create a pay-by-link for a purchase using the new PayByLink code.',
          inputSchema: {
            type: 'object',
            properties: {
              linkType: { type: 'string' },
              purchaseNumber: { type: 'string' },
              currency: { type: 'string' },
              totalAmount: { type: 'string' },
              lineItems: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    productName: { type: 'string' },
                    productSKU: { type: 'string' },
                    description: { type: 'string' },
                    quantity: { type: 'string' },
                    unitPrice: { type: 'string' },
                    totalAmount: { type: 'string' },
                    minAmount: { type: 'string' }
                  },
                  required: ['productName','quantity','unitPrice','totalAmount']
                }
              }
            },
            required: ['linkType','currency','totalAmount','lineItems','purchaseNumber']
          }
        },
        {
          name: 'search_transactions',
          description: 'Search for transactions in Cybersource by providing an advanced query string.',
          inputSchema: {
            type: 'object',
            properties: {
              query: { type: 'string' }
            },
            required: []
          }
        },
        {
          name: 'security-audit',
          description: 'Analyze code base for usage of p12 or message-level encryption configuration.',
          inputSchema: {
            type: 'object',
            properties: {
              path: {
                type: 'string',
                description: 'Directory path to analyze.'
              }
            },
            required: []
          }
        },
        {
          name: 'get_payment_links',
          description: 'Retrieve existing pay-by-links from the system via processPayByLinkGet().',
          inputSchema: {
            type: 'object',
            properties: {},
            required: []
          }
        },
        {
          name: 'create_invoice',
          description: 'Create an invoice using the cybersource sdk. Requires customerInformation, invoiceInformation, and orderInformation objects.',
          inputSchema: {
            type: 'object',
            properties: {
              customerInformation: {
                type: 'object',
                properties: {
                  email: { type: 'string' },
                  name: { type: 'string' }
                },
                required: ['email','name']
              },
              invoiceInformation: {
                type: 'object',
                properties: {
                  deliveryMode: { type: 'string' },
                  description: { type: 'string' },
                  dueDate: { type: 'string' },
                  sendImmediately: { type: 'boolean' }
                },
                required: ['deliveryMode','description','dueDate','sendImmediately']
              },
              orderInformation: {
                type: 'object',
                properties: {
                  amountDetails: {
                    type: 'object',
                    properties: {
                      currency: { type: 'string' },
                      totalAmount: { type: 'string' }
                    },
                    required: ['currency','totalAmount']
                  }
                },
                required: ['amountDetails']
              }
            },
            required: ['customerInformation','invoiceInformation','orderInformation']
          }
        },
        {
          name: 'update_pay_by_link',
          description: 'Update a pay-by-link record using PATCH /ipl/v2/payment-links/{id}. LinkId is required.',
          inputSchema: {
            type: 'object',
            properties: {
              linkType: { type: 'string' },
              linkId: { type: 'string' },
              status: { type: 'string' },
              currency: { type: 'string' },
              totalAmount: { type: 'string' },
              lineItems: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    productName: { type: 'string' },
                    productSKU: { type: 'string' },
                    description: { type: 'string' },
                    quantity: { type: 'string' },
                    unitPrice: { type: 'string' },
                    totalAmount: { type: 'string' },
                    minAmount: { type: 'string' }
                  },
                  required: ['productName','unitPrice']
                }
              }
            },
            required: ['linkType','currency','totalAmount','lineItems','linkId']
          }
        }
      ]
    }));

    // Tool request handler
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const toolName = request.params.name;
      const args = request.params.arguments;

      if (toolName === 'process_refund') {
        if (!args.transaction_id) {
          throw new McpError(ErrorCode.InvalidParams, 'Missing parameter: transaction_id');
        }
        try {
          const result = await processRefund(args.transaction_id, args.amount, args.currency);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    success: true,
                    id: result.id,
                    status: result.status,
                    processor_response: result.processorInformation?.responseCode || 'N/A',
                    transaction_id: args.transaction_id,
                    amount: args.amount ?? 'FULL REFUND',
                    currency: args.currency ?? 'USD',
                    created: new Date().toISOString()
                  },
                  null,
                  2
                )
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: false,
                  error: error.stack || error.message || 'Unknown error in refund processing',
                  transaction_id: args.transaction_id
                }, null, 2)
              }
            ],
            isError: true
          };
        }
      } else if (toolName === 'greeting') {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                greeting: 'hi comrade'
              }, null, 2)
            }
          ]
        };
      } else if (toolName === 'checkout.create_context') {
        if (!args.merchant_id) {
          throw new McpError(ErrorCode.InvalidParams, 'Missing merchant_id');
        }
        try {
          const captureContext = await generateCaptureContext(
            args.merchant_id,
            args.currency,
            args.amount,
            args.allowed_card_networks,
            args.allowed_payment_types,
            args.country,
            args.locale,
            args.capture_mandate,
            args.bill_to,
            args.ship_to
          );
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: true,
                  capture_context: captureContext,
                  merchant_id: args.merchant_id,
                  amount: args.amount ?? 'Not specified',
                  currency: args.currency ?? 'USD',
                  allowed_card_networks: args.allowed_card_networks ?? DEFAULT_CARD_NETWORKS,
                  allowed_payment_types: args.allowed_payment_types ?? ['CLICKTOPAY','PANENTRY','GOOGLEPAY'],
                  country: args.country ?? 'US',
                  locale: args.locale ?? 'en_US',
                  capture_mandate: args.capture_mandate,
                  bill_to: args.bill_to,
                  ship_to: args.ship_to,
                  created: new Date().toISOString()
                }, null, 2)
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: false,
                  error: error.stack || error.message || 'Unknown error in capture context generation',
                  merchant_id: args.merchant_id
                }, null, 2)
              }
            ],
            isError: true
          };
        }
      } else if (toolName === 'create-payment-link') {
        try {
          const result = await createPaymentLink({
            linkType: args.linkType,
            purchaseNumber: args.purchaseNumber,
            currency: args.currency,
            totalAmount: args.totalAmount,
            lineItems: args.lineItems
          });
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: true,
                  payByLinkResponse: result
                }, null, 2)
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: false,
                  error: error.message || 'Unknown error in creating pay by link'
                }, null, 2)
              }
            ],
            isError: true
          };
        }
      } else if (toolName === 'search_transactions') {
        try {
          const apiClient = new cybersourceRestApi.ApiClient();
          const configObject = getConfig();
          apiClient.setConfiguration(configObject);

          const requestObj = new cybersourceRestApi.CreateSearchRequest();
          requestObj.query = args.query || 'submitTimeUtc:[NOW/DAY-7DAYS TO NOW/DAY+1DAY]';
          requestObj.save = 'false';
          requestObj.name = 'MRN';
          requestObj.timezone = 'America/Chicago';
          requestObj.offset = 0;
          requestObj.limit = 100;
          requestObj.sort = 'id:asc,submitTimeUtc:asc';

          const searchApi = new cybersourceRestApi.SearchTransactionsApi(configObject, apiClient);
          const createdSearch = await new Promise((resolve, reject) => {
            searchApi.createSearch(requestObj, (error, data) => {
              if (error) {
                reject(error);
              } else {
                resolve(data);
              }
            });
          });

          if (!createdSearch || !createdSearch.searchId) {
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    success: false,
                    message: 'No searchId returned from createSearch.'
                  }, null, 2)
                }
              ],
              isError: true
            };
          }

          const searchId = createdSearch.searchId;
          const searchData = await new Promise((resolve, reject) => {
            searchApi.getSearch(searchId, (error, data) => {
              if (error) {
                reject(error);
              } else {
                resolve(data);
              }
            });
          });

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: true,
                  searchId,
                  searchData
                }, null, 2)
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: false,
                  error: error.stack || error.message || 'Unknown error in transaction search'
                }, null, 2)
              }
            ],
            isError: true
          };
        }
      } else if (toolName === 'get_payment_links') {
        try {
          const result = await new Promise((resolve, reject) => {
            processPayByLinkGet((err, data, response, status) => {
              if (err) {
                reject(err);
              } else if (status === 0) {
                resolve(response);
              } else {
                reject(new Error('PayByLink get returned error status: ' + status));
              }
            });
          });

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: true,
                  payByLinkGetResponse: result
                }, null, 2)
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: false,
                  error: error.message || 'Unknown error'
                }, null, 2)
              }
            ]
          };
        }
      } else if (toolName === 'create_invoice') {
        // The user wants to create an invoice
        try {
          const apiClient = new cybersourceRestApi.ApiClient();
          const configObject = getConfig();
          apiClient.setConfiguration(configObject);

          console.error('Creating invoice with the Cybersource Node.js SDK...');

          // The user is required to pass in:
          //   customerInformation (email, name)
          //   invoiceInformation (deliveryMode, description, dueDate, sendImmediately)
          //   orderInformation (amountDetails -> currency, totalAmount)
          const invoiceRequest = {
            customerInformation: {
              email: args.customerInformation.email,
              name: args.customerInformation.name
            },
            invoiceInformation: {
              deliveryMode: args.invoiceInformation.deliveryMode,
              description: args.invoiceInformation.description,
              dueDate: args.invoiceInformation.dueDate,
              sendImmediately: args.invoiceInformation.sendImmediately
            },
            orderInformation: {
              amountDetails: {
                currency: args.orderInformation.amountDetails.currency,
                totalAmount: args.orderInformation.amountDetails.totalAmount
              }
            }
          };

          // Hypothetical usage of InvoicesApi
          const invoiceApi = new cybersourceRestApi.InvoicesApi(configObject, apiClient);

          const invoiceResult = await new Promise((resolve, reject) => {
            invoiceApi.createInvoice(invoiceRequest, (err, data) => {
              if (err) {
                reject(err);
              } else {
                resolve(data);
              }
            });
          });

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: true,
                  invoiceResponse: invoiceResult
                }, null, 2)
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: false,
                  error: error.message || 'Unknown error occurred creating invoice'
                }, null, 2)
              }
            ],
            isError: true
          };
        }
      } else if (toolName === 'update_pay_by_link') {
        try {
          const result = await updatePaymentLink({
            linkId: args.linkId,
            linkType: args.linkType,
            currency: args.currency,
            totalAmount: args.totalAmount,
            lineItems: args.lineItems,
            status: args.status
          });
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: true,
                  payByLinkUpdateResponse: result
                }, null, 2)
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: false,
                  error: error.message || 'Unexpected error in update_pay_by_link'
                }, null, 2)
              }
            ],
            isError: true
          };
        }
      } else {
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${toolName}`);
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('CyberSource MCP server running on stdio');
    if (CYBERSOURCE_USE_TEST_ENV) {
      console.error('⚠️ Running in TEST ENVIRONMENT (apitest.cybersource.com)');
    } else {
      console.error('⚠️ Running in PRODUCTION ENVIRONMENT (api.cybersource.com)');
    }
  }
}

async function main() {
  try {
    const server = new CyberSourceMcpServer();
    await server.run();
  } catch (error) {
    console.error('Error starting CyberSource MCP server:', error.message);
    process.exit(1);
  }
}

module.exports = {
  CyberSourceMcpServer,
  main,
  generateCaptureContext,
  createPaymentLink,
  updatePaymentLink
};

// If invoked directly, start the server
if (require.main === module) {
  main().catch(console.error);
}
