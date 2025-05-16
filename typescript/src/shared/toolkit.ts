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
// Parameter types still needed for type checking


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
        list?: boolean;
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

  // Visa Acceptance context
  private visaContext: VisaContext;

  /**
   * Creates a new Visa Acceptance Agent Toolkit
   * @param options Configuration options
   */
  constructor(options: VisaAcceptanceAgentToolkitOptions = {}) {
    dotenv.config();

    // Initialize with options or environment variables
    this.visaContext = {
      // Check for both new simplified names AND old names for backward compatibility
      // New simplified names take precedence if both are defined
      merchantId: options.merchantId || process.env.MERCHANT_ID || process.env.VISA_ACCEPTANCE_MERCHANT_ID || '',
      apiKeyId: options.apiKeyId || process.env.API_KEY_ID || process.env.VISA_ACCEPTANCE_API_KEY_ID || '',
      secretKey: options.secretKey || process.env.SECRET_KEY || process.env.VISA_ACCEPTANCE_SECRET_KEY || '',
      environment: options.environment || 'SANDBOX'
    };

    // Validate required credentials
    if ((!this.visaContext.merchantId || !this.visaContext.apiKeyId || !this.visaContext.secretKey)) {
      throw new Error('Missing Visa Acceptance API credentials. Please provide them in options or set environment variables.');
    }

    // Instantiate the MCP Server
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
    // Get the tools from the TypeScript project
    // Create a VisaContext from our context
    const visaContext: VisaContext = {
      merchantId: process.env.VISA_ACCEPTANCE_MERCHANT_ID || '',
      apiKeyId: process.env.VISA_ACCEPTANCE_API_KEY_ID || '',
      secretKey: process.env.VISA_ACCEPTANCE_SECRET_KEY || '',
      environment: 'SANDBOX'
      // mode is not part of VisaContext type
    };
    const toolDefinitions = tools(visaContext);
    
    // Define mapping between tool methods and MCP-expected names
    const methodToMcpName: Record<string, string> = {
      'create_invoice': 'invoices.create',
      'list_invoices': 'invoices.list',
      'get_invoice': 'invoices.get',
      'update_invoice': 'invoices.update'
    };
    
    // Debug: Print out the available tools
    console.error('Available tools:');
    toolDefinitions.forEach((tool: Tool) => {
      const mcpName = methodToMcpName[tool.method] || `custom.${tool.method}`;
      console.error(`- ${tool.name} (${tool.method} → ${mcpName}): ${tool.description.substring(0, 50)}...`);
    });
    
    // Provide the list of tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const toolsList = toolDefinitions.map((tool: Tool) => {
        // Use the MCP-expected name format if available, otherwise format as 'custom.{method}'
        const name = methodToMcpName[tool.method] || `custom.${tool.method}`;
        
        // Convert Zod schema to JSON Schema format
        const properties: Record<string, any> = {};
        const required: string[] = [];
        
        // Process each field in the Zod schema
        Object.entries(tool.parameters.shape).forEach(([key, field]: [string, any]) => {
          // Skip internal Zod properties
          if (key.startsWith('_')) return;
          
          // Get the field type
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
          
          // Get description if available
          const description = field._def.description || '';
          
          // Check if field is required
          if (!field.isOptional()) {
            required.push(key);
          }
          
          // Add to properties
          properties[key] = {
            type,
            description
          };
          
          // Handle nested objects
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
          
          // Handle arrays
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
        
        // Create the JSON Schema
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

    // Define reverse mapping from MCP names to tool methods
    const mcpNameToMethod: Record<string, string> = {};
    Object.entries(methodToMcpName).forEach(([method, mcpName]) => {
      mcpNameToMethod[mcpName] = method;
    });

    // Tool request handler
    this.server.setRequestHandler(CallToolRequestSchema, async (request: any): Promise<any> => {
      const mcpToolName = request.params.name;
      const args = request.params.arguments;
      
      // Map from MCP name format to our internal method name
      let toolName: string;
      if (mcpNameToMethod[mcpToolName]) {
        // Use the mapped method name if available
        toolName = mcpNameToMethod[mcpToolName];
      } else if (mcpToolName.startsWith('custom.')) {
        // Extract the method name from custom.{method} format
        toolName = mcpToolName.substring(7); // Remove 'custom.' prefix
      } else {
        // Fallback to using the MCP name directly
        toolName = mcpToolName;
      }
      
      console.error(`Tool requested: ${mcpToolName} → ${toolName}`);
      console.error(`Arguments: ${JSON.stringify(args, null, 2)}`);

      // Use real Cybersource API client calls
      try {
        // Find the appropriate tool from toolDefinitions based on the tool name
        const tool = toolDefinitions.find((t: Tool) => t.method === toolName);
        
        if (!tool) {
          throw new Error(`Unknown tool: ${toolName}`);
        }
        
        console.error(`Executing tool: ${tool.name} (${tool.method})`);
        
        // Create the Visa API client
        const visaClient = new VisaAcceptanceAPI(this.visaContext)._apiClient;
        
        // Call the tool's execute method with the Visa client, context, and arguments
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
    if (this.visaContext.environment === 'SANDBOX') {
      console.error('⚠️ Running in SANDBOX ENVIRONMENT (apitest.cybersource.com)');
    } else {
      console.error('⚠️ Running in PRODUCTION ENVIRONMENT (api.cybersource.com)');
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