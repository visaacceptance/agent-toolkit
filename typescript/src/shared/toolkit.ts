/* © 2025 Visa.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import dotenv from 'dotenv';
import { Context } from './configuration';
import tools from './tools';
import { Tool } from './tools';
import VisaAcceptanceAPI from './api';


/**
 * API response interface
 */
export interface ApiResponse {
  success: boolean;
  result?: any;
  error?: string;
}

/**
 * Tool response interface for MCP
 */
export interface ToolResponse {
  content: {
    type: string;
    text: string;
  }[];
  isError?: boolean;
}

/**
 * Visa context interface
 */
export interface VisaContext {
  merchantId: string;
  apiKeyId: string;
  secretKey: string;
  environment: string;
}

/**
 * Configuration interface for Visa Acceptance Agent Toolkit
 * Follows the pattern from the Stripe example
 */
export interface VisaAcceptanceAgentToolkitOptions {
  merchantId?: string;
  apiKeyId?: string;
  secretKey?: string;
  environment?: string;
  configuration?: {
    actions?: {
      invoices?: {
        create?: boolean;
        read?: boolean;
        update?: boolean;
      };
      paymentLinks?: {
        create?: boolean;
        read?: boolean;
        update?: boolean;
      };
    };
  };
}

/**
 * Visa Acceptance Agent Toolkit class
 * Encapsulates the MCP server functionality
 */
export class VisaAcceptanceAgentToolkit {
  private server: Server;
  private context: Context = {
    mode: 'modelcontextprotocol'
  };

  private visaContext: VisaContext;

  /**
   * Creates a new Visa Acceptance Agent Toolkit
   * @param options Configuration options
   */
  constructor(options: VisaAcceptanceAgentToolkitOptions = {}) {
    dotenv.config();

    this.visaContext = {
      merchantId: options.merchantId || process.env.MERCHANT_ID || process.env.VISA_ACCEPTANCE_MERCHANT_ID || '',
      apiKeyId: options.apiKeyId || process.env.API_KEY_ID || process.env.VISA_ACCEPTANCE_API_KEY_ID || '',
      secretKey: options.secretKey || process.env.SECRET_KEY || process.env.VISA_ACCEPTANCE_SECRET_KEY || '',
      environment: options.environment || 'SANDBOX'
    };

    if ((!this.visaContext.merchantId || !this.visaContext.apiKeyId || !this.visaContext.secretKey)) {
      throw new Error('Missing Visa Acceptance API credentials. Please provide them in options or set environment variables.');
    }

    this.server = new Server(
      {
        name: 'visa-acceptance',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {
            enabled: true
          },
        },
      }
    );

    this.setupToolHandlers();

    this.server.onerror = (error: Error) => {
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  /**
   * Set up tool handlers for the MCP server
   */
  private setupToolHandlers(): void {
    const visaContext: VisaContext = {
      merchantId: process.env.VISA_ACCEPTANCE_MERCHANT_ID || '',
      apiKeyId: process.env.VISA_ACCEPTANCE_API_KEY_ID || '',
      secretKey: process.env.VISA_ACCEPTANCE_SECRET_KEY || '',
      environment: process.env.VISA_ACCEPTANCE_ENVIRONMENT || 'SANDBOX'
    };
    const toolDefinitions = tools(visaContext);
    
    const methodToMcpName: Record<string, string> = {
    };
    
    console.error('Available tools:');
    toolDefinitions.forEach((tool: Tool) => {
      const mcpName = methodToMcpName[tool.method] || `custom.${tool.method}`;
      console.error(`- ${tool.name} (${tool.method} → ${mcpName}): ${tool.description.substring(0, 50)}...`);
    });
    
    /**
     * Handle tool listing requests - converts Zod schemas to JSON Schema format
     */
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const toolsList = toolDefinitions.map((tool: Tool) => {
        const name = methodToMcpName[tool.method] || `custom.${tool.method}`;
        const properties: Record<string, any> = {};
        const required: string[] = [];
        
        Object.entries(tool.parameters.shape).forEach(([key, field]: [string, any]) => {
          if (key.startsWith('_')) return;
          
          let type = 'string';
          if (field._def.typeName === 'ZodNumber') {
            type = 'number';
          } else if (field._def.typeName === 'ZodBoolean') {
            type = 'boolean';
          } else if (field._def.typeName === 'ZodArray') {
            type = 'array';
          } else if (field._def.typeName === 'ZodObject') {
            type = 'object';
          }
          
          const description = field._def.description || '';
          
          if (!field.isOptional()) {
            required.push(key);
          }
          
          properties[key] = {
            type,
            description
          };
          
          if (field._def.typeName === 'ZodObject' && field.shape) {
            properties[key].properties = {};
            const nestedRequired: string[] = [];
            
            Object.entries(field.shape).forEach(([nestedKey, nestedField]: [string, any]) => {
              if (nestedKey.startsWith('_')) return;
              
              let nestedType = 'string';
              if (nestedField._def.typeName === 'ZodNumber') {
                nestedType = 'number';
              } else if (nestedField._def.typeName === 'ZodBoolean') {
                nestedType = 'boolean';
              }
              
              const nestedDescription = nestedField._def.description || '';
              
              if (!nestedField.isOptional()) {
                nestedRequired.push(nestedKey);
              }
              
              properties[key].properties[nestedKey] = {
                type: nestedType,
                description: nestedDescription
              };
            });
            
            if (nestedRequired.length > 0) {
              properties[key].required = nestedRequired;
            }
          }
          
          if (field._def.typeName === 'ZodArray' && field._def.type) {
            properties[key].items = {
              type: 'object',
              properties: {}
            };
            
            if (field._def.type._def.typeName === 'ZodObject' && field._def.type.shape) {
              const arrayItemRequired: string[] = [];
              
              Object.entries(field._def.type.shape).forEach(([itemKey, itemField]: [string, any]) => {
                if (itemKey.startsWith('_')) return;
                
                let itemType = 'string';
                if (itemField._def.typeName === 'ZodNumber') {
                  itemType = 'number';
                } else if (itemField._def.typeName === 'ZodBoolean') {
                  itemType = 'boolean';
                }
                
                const itemDescription = itemField._def.description || '';
                
                if (!itemField.isOptional()) {
                  arrayItemRequired.push(itemKey);
                }
                
                properties[key].items.properties[itemKey] = {
                  type: itemType,
                  description: itemDescription
                };
              });
              
              if (arrayItemRequired.length > 0) {
                properties[key].items.required = arrayItemRequired;
              }
            }
          }
        });
        
        const inputSchema = {
          type: 'object',
          properties: properties,
          required: required
        };
        
        return {
          name: name,
          description: tool.description,
          inputSchema: inputSchema
        };
      });
      
      console.error(`Responding with ${toolsList.length} tools`);
      return { tools: toolsList };
    });

    const mcpNameToMethod: Record<string, string> = {};
    Object.entries(methodToMcpName).forEach(([method, mcpName]) => {
      mcpNameToMethod[mcpName] = method;
    });

    /**
     * Handle tool execution requests
     */
    this.server.setRequestHandler(CallToolRequestSchema, async (request: any): Promise<any> => {
      const mcpToolName = request.params.name;
      const args = request.params.arguments;
      
      let toolName: string;
      if (mcpNameToMethod[mcpToolName]) {
        toolName = mcpNameToMethod[mcpToolName];
      } else if (mcpToolName.startsWith('custom.')) {
        toolName = mcpToolName.substring(7);
      } else {
        toolName = mcpToolName;
      }

      try {
        const tool = toolDefinitions.find((t: Tool) => t.method === toolName);
        
        if (!tool) {
          throw new Error(`Unknown tool: ${toolName}`);
        }  
        const visaClient = new VisaAcceptanceAPI(this.visaContext)._apiClient;
        const result = await tool.execute(visaClient, this.visaContext, args);

        return this.formatResponse({ success: true, result });
      } catch (error) {
        console.error(`Error executing tool ${toolName}:`, error);
        const errorMessage = error instanceof Error ? error.message : `Unknown error occurred with ${toolName}`;
        return this.formatResponse({ success: false, error: errorMessage }, true);
      }
    });
  }


  /**
   * Format the response for the MCP server
   */
  private formatResponse(response: ApiResponse, isError: boolean = false): ToolResponse {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response, null, 2)
        }
      ],
      isError
    };
  }


  /**
   * Connect and run the MCP server
   */
  async connect(transport?: StdioServerTransport): Promise<void> {
    const serverTransport = transport || new StdioServerTransport();
    await this.server.connect(serverTransport);
    console.error('Visa Acceptance MCP server running on stdio');
    if (this.visaContext.environment === 'PRODUCTION') {
      console.error('⚠️ Running in PRODUCTION ENVIRONMENT');
    } else {
      console.error('⚠️ Running in SANDBOX ENVIRONMENT');
    }
  }

  /**
   * Close the MCP server
   */
  async close(): Promise<void> {
    await this.server.close();
  }
}

export default VisaAcceptanceAgentToolkit;