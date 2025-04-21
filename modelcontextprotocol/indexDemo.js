//! Updated index.js to use processPayByLink from PayByLink.js directly

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
const getConfig = require('./config.js');
const superagent = require('superagent');
const {
  processPayByLink,
  processPayByLinkGet
} = require('./PayByLink.js'); // Import the new PayByLink functions

dotenv.config();

const CYBERSOURCE_MERCHANT_ID = process.env.CYBERSOURCE_MERCHANT_ID || "visa_acceptance_llm_01";
const CYBERSOURCE_API_KEY_ID = process.env.CYBERSOURCE_API_KEY_ID || "9809ebfb-e5ce-43af-8f2d-90f65770c4bc";
const CYBERSOURCE_SECRET_KEY = process.env.CYBERSOURCE_SECRET_KEY || "K3UY4P0qRlca7fdjzRmVl0yBSefaXZ8OcDhMag9WDtk=";
const CYBERSOURCE_USE_TEST_ENV = process.env.CYBERSOURCE_USE_TEST_ENV || 'true';

if ((!CYBERSOURCE_MERCHANT_ID || !CYBERSOURCE_API_KEY_ID || !CYBERSOURCE_SECRET_KEY)) {
  console.error('Error: Missing CyberSource API credentials in environment variables');
  console.error('Please set CYBERSOURCE_MERCHANT_ID, CYBERSOURCE_API_KEY_ID, and CYBERSOURCE_SECRET_KEY');
  console.error('Alternatively, set CYBERSOURCE_MOCK_MODE=true to run in mock mode for testing');
  process.exit(1);
}

const DEFAULT_CARD_NETWORKS = ['VISA', 'MASTERCARD', 'AMEX'];

async function processRefund(transactionId, amount, currency = 'USD') {
  if (!transactionId) {
    throw new Error('Transaction ID is required');
  }
  try {
    var apiClient = new cybersourceRestApi.ApiClient();
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
 * Instead of re-implementing pay-by-link logic here,
 * we now call the processPayByLink function from PayByLink.js
 *
 * We'll build a JSON body string from the user-supplied data
 * so that the underlying processPayByLink function can accept a string.
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
          // Removed template literal to avoid TS parse error
          reject(new Error('PayByLink get returned error status: ' + status));
        }
      },
      {
        // Optionally you could override merchant config here
        // e.g. merchantKeyId, merchantSecretKey, merchantId, requestHost
      }
    );
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

    // Setup the handlers for each tool
    this.setupToolHandlers();

    // Handle server errors
    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };

    // Graceful shutdown on SIGINT
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
          description:
            'Process a refund for a previous transaction. Use this when a user wants to refund a specific transaction, such as "refund my transaction 12345" or "refund $40 USD from transaction 12345".',
          inputSchema: {
            type: 'object',
            properties: {
              transaction_id: {
                type: 'string',
                description:
                  'The ID of the transaction to refund (e.g., "12345", "tx_abc123")'
              },
              amount: {
                type: 'number',
                description:
                  'Optional amount to refund (e.g., 40 for $40.00). If not provided, the full amount will be refunded.'
              },
              currency: {
                type: 'string',
                description:
                  'Optional currency code (e.g., "USD", "EUR"). Defaults to USD if not provided.'
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
          name: 'checkout.create_context',
          description:
            'Generate a capture context for payment processing. Use this when a user wants to create a payment form or checkout experience, e.g., "generate a capture context for Visa cards"',
          inputSchema: {
            type: 'object',
            properties: {
              merchant_id: {
                type: 'string',
                description:
                  'The merchant ID for the capture context (required for payment processing)'
              },
              currency: {
                type: 'string',
                description:
                  'Currency code for payment processing. Defaults to USD if not provided.'
              },
              amount: {
                type: 'number',
                description:
                  'Amount for the transaction (e.g., 100 for $100). If not provided, a default amount is used.'
              },
              allowed_card_networks: {
                type: 'array',
                items: { type: 'string' },
                description:
                  'Card networks to accept (e.g. ["VISA"]). Defaults to VISA,MASTERCARD,AMEX.'
              },
              allowed_payment_types: {
                type: 'array',
                items: { type: 'string' },
                description:
                  'Optional array of allowed payment types. Defaults to CLICKTOPAY,PANENTRY,GOOGLEPAY.'
              },
              country: {
                type: 'string',
                description:
                  'Optional country code. Defaults to US if not provided.'
              },
              locale: {
                type: 'string',
                description:
                  'Optional locale code. Defaults to en_US if not provided.'
              },
              capture_mandate: {
                type: 'object',
                properties: {
                  billing_type: {
                    type: 'string',
                    description: 'Billing type (FULL)'
                  },
                  request_email: {
                    type: 'boolean',
                    description: 'Whether to request email'
                  },
                  request_phone: {
                    type: 'boolean',
                    description: 'Whether to request phone'
                  },
                  request_shipping: {
                    type: 'boolean',
                    description: 'Whether to request shipping info'
                  },
                  ship_to_countries: {
                    type: 'array',
                    items: { type: 'string' },
                    description:
                      'Array of countries that can be shipped to'
                  },
                  show_accepted_network_icons: {
                    type: 'boolean',
                    description:
                      'Whether to show accepted network icons'
                  }
                },
                description: 'Optional capture mandate settings'
              },
              bill_to: {
                type: 'object',
                description: 'Optional billing information'
              },
              ship_to: {
                type: 'object',
                description: 'Optional shipping information'
              }
            },
            required: ['merchant_id']
          }
        },
        {
          name: 'create_payment_link',
          description:
            'Create a pay-by-link for a purchase using the new PayByLink code.',
          inputSchema: {
            type: 'object',
            properties: {
              linkType: {
                type: 'string',
                description: 'Type of link to create, e.g. PURCHASE'
              },
              purchaseNumber: {
                type: 'string',
                description:
                  'Only letters (A–Z, a–z) and numbers (0–9) are permitted. Special characters or underscores are not allowed. Make sure number values are randomly generated. Total length no longer than 12 characters'
              },
              currency: {
                type: 'string',
                description: 'Currency code, e.g. "USD"'
              },
              totalAmount: {
                type: 'string',
                description: 'Total amount, e.g. "60"'
              },
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
                    totalAmount: { type: 'string' }
                  },
                  required: [
                    'productName',
                    'productSKU',
                    'quantity',
                    'unitPrice',
                    'totalAmount'
                  ]
                },
                description:
                  'Array of line items with productName, productSKU, description, quantity, unitPrice, totalAmount'
              }
            },
            required: ['linkType', 'currency', 'totalAmount', 'lineItems', 'purchaseNumber']
          }
        },
        {
          name: 'search_transactions',
          description:
            'Search for transactions in Cybersource by providing an advanced query string, e.g. "submitTimeUtc:[NOW/DAY-7DAYS TO NOW/DAY+1DAY]". Example: from past day "submitTimeUtc:[NOW/DAY-1DAYS TO NOW/DAY+1DAY}"',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Cybersource advanced query'
              }
            },
            required: []
          }
        },
        {
          name: 'security.audit',
          description:
            'Analyze code base for usage of p12 or message-level encryption configuration. Provide a summary of potential rule violations in merchant code.',
          inputSchema: {
            type: 'object',
            properties: {
              path: {
                type: 'string',
                description:
                  'Directory path to analyze. Defaults to current directory if not provided.'
              }
            },
            required: []
          }
        },
        {
          name: 'get_payment_links',
          description:
            'Retrieve existing pay-by-links from the system. Calls processPayByLinkGet() in PayByLink.js.',
          inputSchema: {
            type: 'object',
            properties: {},
            required: []
          }
        },
        {
          name: 'create_invoice',
          description: 'Create an invoice using the cybersource sdk',
          inputSchema: {
            type: 'object',
            properties: {
              invoice_number: {
                type: 'string',
                description: 'Invoice number identifier'
              },
              totalAmount: {
                type: 'string',
                description: 'Invoice total amount e.g. "100.00"'
              },
              currency: {
                type: 'string',
                description: 'Invoice currency code e.g. "USD"'
              }
            },
            required: [
              'invoice_number',
              'totalAmount',
              'currency'
            ]
          }
        }
      ]
    }));

    // Handle incoming tool requests
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const toolName = request.params.name;
      const args = request.params.arguments;

      if (toolName === 'process_refund') {
        if (!args.transaction_id) {
          throw new McpError(ErrorCode.InvalidParams, 'Missing required parameter: transaction_id');
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
                text: JSON.stringify(
                  {
                    success: false,
                    error: error.stack || error.message || 'Unknown error occurred during refund processing',
                    transaction_id: args.transaction_id
                  },
                  null,
                  2
                )
              }
            ],
            isError: true
          };
        }
      } else if (toolName === 'greeting') {
        // Simple greeting
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  greeting: 'hi comrade'
                },
                null,
                2
              )
            }
          ]
        };
      } else if (toolName === 'checkout.create_context') {
        if (!args.merchant_id) {
          throw new McpError(ErrorCode.InvalidParams, 'Missing required parameter: merchant_id');
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
                text: JSON.stringify(
                  {
                    success: true,
                    capture_context: captureContext,
                    merchant_id: args.merchant_id,
                    amount: args.amount ?? 'Not specified',
                    currency: args.currency ?? 'USD',
                    allowed_card_networks: args.allowed_card_networks ?? DEFAULT_CARD_NETWORKS,
                    allowed_payment_types: args.allowed_payment_types ?? ['CLICKTOPAY', 'PANENTRY', 'GOOGLEPAY'],
                    country: args.country ?? 'US',
                    locale: args.locale ?? 'en_US',
                    capture_mandate: args.capture_mandate,
                    bill_to: args.bill_to,
                    ship_to: args.ship_to,
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
                text: JSON.stringify(
                  {
                    success: false,
                    error: error.stack || error.message || 'Unknown error occurred during capture context generation',
                    errorDetails: error,
                    merchant_id: args.merchant_id
                  },
                  null,
                  2
                )
              }
            ],
            isError: true
          };
        }
      } else if (toolName === 'create_payment_link') {
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
                text: JSON.stringify(
                  {
                    success: true,
                    payByLinkResponse: result
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
                text: JSON.stringify(
                  {
                    success: false,
                    error: error.message || 'Unknown error occurred creating pay by link'
                  },
                  null,
                  2
                )
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
          requestObj.query = args.query || 'submitTimeUtc:[NOW/DAY-7DAYS TO NOW/DAY+1DAY}';
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
                  text: JSON.stringify(
                    {
                      success: false,
                      message: 'No searchId returned from createSearch.'
                    },
                    null,
                    2
                  )
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
                text: JSON.stringify(
                  {
                    success: true,
                    searchId,
                    searchData
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
                text: JSON.stringify(
                  {
                    success: false,
                    error: error.stack || error.message || 'Unknown error occurred during transaction search'
                  },
                  null,
                  2
                )
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
                resolve(data);
              } else {
                reject(new Error('PayByLink get returned error status: ' + status));
              }
            });
          });
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    success: true,
                    payByLinkGetResponse: result
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
                text: JSON.stringify(
                  {
                    success: false,
                    error: error.message || 'Unknown error occurred retrieving pay by links'
                  },
                  null,
                  2
                )
              }
            ],
            isError: true
          };
        }
} else if (toolName === 'create_invoice') {
        try {
          console.error('Creating invoice with the Cybersource Node.js SDK...');
          const apiClient = new cybersourceRestApi.ApiClient();
          const configObject = getConfig();
          apiClient.setConfiguration(configObject);

          // Construct a hypothetical invoice request object
          // (In reality, you would replace this with the correct fields and classes for the Invoice API)
          const invoiceRequest = {
            clientReferenceInformation: {
              code: `invoice-${Date.now()}`
            },
            orderInformation: {
              amountDetails: {
                totalAmount: args.totalAmount,
                currency: args.currency
              }
            }
          };

          // Hypothetical InvoiceApi usage (replace with the actual class/method you need)
          const invoiceApi = new cybersourceRestApi.InvoiceApi(configObject, apiClient);

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
                text: JSON.stringify(
                  {
                    success: true,
                    invoiceResponse: invoiceResult
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
                text: JSON.stringify(
                  {
                    success: false,
                    error: error.message || 'Unknown error occurred creating invoice'
                  },
                  null,
                  2
                )
              }
            ],
            isError: true
          };
        }
      } else if (toolName === 'security.audit') {
        const fs = require('fs');
        const pathLib = require('path');

        const targetPath = args.path || '.';
        let foundP12 = false;
        let foundMLE = false;
        let scannedFiles = 0;

        function walkDir(dir) {
          const files = fs.readdirSync(dir);
          for (const file of files) {
            const filePath = pathLib.join(dir, file);
            const stats = fs.lstatSync(filePath);
            if (stats.isDirectory()) {
              walkDir(filePath);
            } else {
              scannedFiles++;
              const content = fs.readFileSync(filePath, 'utf8');
              // Very naive checks for usage of p12 or message-level encryption
              if (content.includes('p12')) {
                foundP12 = true;
              }
              if (content.includes('message-level encryption')) {
                foundMLE = true;
              }
            }
          }
        }

        try {
          walkDir(targetPath);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    success: true,
                    scannedFiles,
                    foundP12,
                    foundMLE,
                    message: 'Analysis complete.'
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
                text: JSON.stringify(
                  {
                    success: false,
                    error: error.stack || error.message || 'Error occurred during security audit'
                  },
                  null,
                  2
                )
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

  // Start the MCP server
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

// Helper function to initialize and run the server
async function main() {
  try {
    const server = new CyberSourceMcpServer();
    await server.run();
  } catch (error) {
    console.error('Error starting CyberSource MCP server:', error.message);
    process.exit(1);
  }
}

// Export for external usage
module.exports = {
  CyberSourceMcpServer,
  main,
  generateCaptureContext,
  createPaymentLink
};

// If the file is invoked directly, run the server
if (require.main === module) {
  main().catch(console.error);
}
