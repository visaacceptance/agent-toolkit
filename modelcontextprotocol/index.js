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
dotenv.config();

const VISA_ACCEPTANCE_MERCHANT_ID = process.env.VISA_ACCEPTANCE_MERCHANT_ID || '';
const VISA_ACCEPTANCE_API_KEY_ID = process.env.VISA_ACCEPTANCE_API_KEY_ID || '';
const VISA_ACCEPTANCE_SECRET_KEY = process.env.VISA_ACCEPTANCE_SECRET_KEY || '';
const VISA_ACCEPTANCE_USE_TEST_ENV = process.env.VISA_ACCEPTANCE_USE_TEST_ENV || 'true';

if ((!VISA_ACCEPTANCE_MERCHANT_ID || !VISA_ACCEPTANCE_API_KEY_ID || !VISA_ACCEPTANCE_SECRET_KEY)) {
  console.error('Error: Missing Visa Acceptance API credentials in environment variables');
  console.error('Please set VISA_ACCEPTANCE_MERCHANT_ID, VISA_ACCEPTANCE_API_KEY_ID, and VISA_ACCEPTANCE_SECRET_KEY');
  process.exit(1);
}


class VisaAcceptanceMcpServer {
  constructor() {
    // Instantiate the MCP Server
    this.server = new Server(
      {
        name: 'visa-acceptance',
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
          name: 'create_invoice',
          description: 'This tool will create an invoice in Visa Acceptance.',
          inputSchema: {
            type: 'object',
            properties: {
              customerInformation: {
                type: 'object',
                properties: {
                  email: { type: 'string' },
                  name: { type: 'string' }
                },
                required: ['email']
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
            required: ['invoiceInformation','orderInformation']
          }
        },
        {
          name: 'list_invoices',
          description: 'This tool will list invoices from Visa Acceptance',
          inputSchema: {
            type: 'object',
            properties: {
              offset: { type: 'number' },
              limit: { type: 'number' },
              status: { type: 'string' }
            }
          }
        },
        {
          name: 'get_invoice',
          description: 'This tool will get a specific invoice from Visa Acceptance',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'string' }
            },
            required: ['id']
          }
        },
        {
          name: 'update_invoice',
          description: 'This tool will update an invoice in Visa Acceptance',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              customerInformation: {
                type: 'object',
                properties: {
                  email: { type: 'string' },
                  name: { type: 'string' }
                }
              },
              invoiceInformation: {
                type: 'object',
                properties: {
                  description: { type: 'string' },
                  dueDate: { type: 'string' },
                  allowPartialPayments: { type: 'boolean' },
                  deliveryMode: { type: 'string' }
                }
              },
              orderInformation: {
                type: 'object',
                properties: {
                  amountDetails: {
                    type: 'object',
                    properties: {
                      totalAmount: { type: 'string' },
                      currency: { type: 'string' },
                      discountAmount: { type: 'string' },
                      discountPercent: { type: 'number' },
                      subAmount: { type: 'number' },
                      minimumPartialAmount: { type: 'number' }
                    },
                    required: ['totalAmount', 'currency']
                  }
                },
                required: ['amountDetails']
              }
            },
            required: ['id', 'customerInformation', 'invoiceInformation', 'orderInformation']
          }
        }
      ]
    }));

    // Tool request handler
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const toolName = request.params.name;
      const args = request.params.arguments;

      const apiClient = new cybersourceRestApi.ApiClient();
      const configObject = getConfig();
      apiClient.setConfiguration(configObject);
      const invoiceApi = new cybersourceRestApi.InvoicesApi(configObject, apiClient);

      try {
        let result;
        switch (toolName) {
          case 'create_invoice':
            result = await this.createInvoice(invoiceApi, args);
            break;
          case 'list_invoices':
            result = await this.listInvoices(invoiceApi, args);
            break;
          case 'get_invoice':
            result = await this.getInvoice(invoiceApi, args);
            break;
          case 'update_invoice':
            result = await this.updateInvoice(invoiceApi, args);
            break;
          default:
            throw new Error(`Unknown tool: ${toolName}`);
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                result: result
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
                error: error.message || `Unknown error occurred with ${toolName}`
              }, null, 2)
            }
          ],
          isError: true
        };
      }
    });
  }

  async createInvoice(invoiceApi, args) {
    const invoiceRequest = {
      customerInformation: args.customerInformation,
      invoiceInformation: args.invoiceInformation,
      orderInformation: args.orderInformation
    };

    return new Promise((resolve, reject) => {
      invoiceApi.createInvoice(invoiceRequest, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
  }

  async listInvoices(invoiceApi, args) {
    return new Promise((resolve, reject) => {
      invoiceApi.getAllInvoices(args.offset, args.limit, args.status, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
  }

  async getInvoice(invoiceApi, args) {
    return new Promise((resolve, reject) => {
      invoiceApi.getInvoice(args.id, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
  }

  async updateInvoice(invoiceApi, args) {
    const { id, ...updateRequest } = args;
    return new Promise((resolve, reject) => {
      invoiceApi.updateInvoice(id, updateRequest, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Visa Acceptance MCP server running on stdio');
    if (VISA_ACCEPTANCE_USE_TEST_ENV) {
      console.error('⚠️ Running in TEST ENVIRONMENT (apitest.cybersource.com)');
    } else {
      console.error('⚠️ Running in PRODUCTION ENVIRONMENT (api.cybersource.com)');
    }
  }
}

async function main() {
  try {
    const server = new VisaAcceptanceMcpServer();
    await server.run();
  } catch (error) {
    console.error('Error starting Visa Acceptance MCP server:', error.message);
    process.exit(1);
  }
}

module.exports = {
  VisaAcceptanceMcpServer,
  main
};

// If invoked directly, start the server
if (require.main === module) {
  main().catch(console.error);
}
