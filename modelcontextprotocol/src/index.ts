#!/usr/bin/env node

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import dotenv from 'dotenv';
import { green, yellow, red } from 'colors';
// Import the toolkit from the package
import { VisaAcceptanceAgentToolkit } from '@visa-acceptance/agent-toolkit';



// Load environment variables
dotenv.config();

type ToolkitConfig = {
  actions: {
    [product: string]: {[action: string]: boolean};
  };
  context?: {
    account?: string;
    mode: 'modelcontextprotocol';
  };
};

// Define accepted command-line arguments
const ACCEPTED_ARGS = ['merchant-id', 'api-key-id', 'secret-key', 'environment', 'tools'];

// Define accepted tools
const ACCEPTED_TOOLS = [
  'create_invoice',
  'list_invoices',
  'get_invoice',
  'update_invoice'
];

// Define options type
type Options = {
  merchantId?: string;
  apiKeyId?: string;
  secretKey?: string;
  environment?: string;
  tools?: string[];
};

/**
 * Parse command-line arguments
 * @param args Command-line arguments
 * @returns Parsed options
 */
export function parseArgs(args: string[]): Options {
  const options: Options = {};

  args.forEach((arg) => {
    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=');

      if (key === 'tools') {
        options.tools = value.split(',');
      } else if (key === 'merchant-id') {
        options.merchantId = value;
      } else if (key === 'api-key-id') {
        options.apiKeyId = value;
      } else if (key === 'secret-key') {
        options.secretKey = value;
      } else if (key === 'environment') {
        options.environment = value;
      } else {
        throw new Error(
          `Invalid argument: ${key}. Accepted arguments are: ${ACCEPTED_ARGS.join(', ')}`
        );
      }
    }
  });

  return options;
}

/**
 * Handle errors
 * @param error Error object
 */
function handleError(error: any) {
  console.error(red('\n🚨 Error initializing Visa Acceptance MCP server:\n'));
  console.error(yellow(`   ${error.message}\n`));
  process.exit(1);
}

/**
 * Main function to initialize and run the MCP server
 */
export async function main(): Promise<void> {
  try {
    // Parse command-line arguments
    const options = parseArgs(process.argv.slice(2));

    // Create the configuration
    // Check for tools in command-line args first, then environment variables
    // Check for both new simplified names AND old names for backward compatibility
    // New simplified names take precedence if both are defined
    const toolsFromEnv = process.env.ACCEPTANCE_TOOLS ?
      process.env.ACCEPTANCE_TOOLS.split(',') :
      process.env.VISA_ACCEPTANCE_TOOLS ?
        process.env.VISA_ACCEPTANCE_TOOLS.split(',') :
        undefined;
    
    const selectedTools = options.tools || toolsFromEnv;
    // Initialize with non-null values to avoid TypeScript errors
    const toolkitConfig: ToolkitConfig = {
      actions: {
        invoices: {}
      }
    };

    // Ensure selectedTools is defined before using it
    if (!selectedTools) {
      throw new Error('No tools specified. Please provide tools via --tools argument or ACCEPTANCE_TOOLS/VISA_ACCEPTANCE_TOOLS environment variable.');
    }

    if (selectedTools.includes('all')) {
      // Enable all tools
      toolkitConfig.actions = {
        invoices: {
          create: true,
          list: true,
          get: true,
          update: true
        }
      };
    } else {
      selectedTools.forEach((tool: string) => {
        // Ensure invoices object exists
        if (!toolkitConfig.actions) toolkitConfig.actions = {};
        if (!toolkitConfig.actions.invoices) toolkitConfig.actions.invoices = {};
        
        // Map tool names to product/action pairs
        if (tool === 'create_invoice') {
          toolkitConfig.actions.invoices.create = true;
        } else if (tool === 'list_invoices') {
          toolkitConfig.actions.invoices.list = true;
        } else if (tool === 'get_invoice') {
          toolkitConfig.actions.invoices.get = true;
        } else if (tool === 'update_invoice') {
          toolkitConfig.actions.invoices.update = true;
        } else {
          console.error(`Warning: Unknown tool: ${tool}`);
        }
      });
    }

    toolkitConfig.context = {
      mode: 'modelcontextprotocol'
    };

    // Initialize the toolkit with options
    const mcpServer = new VisaAcceptanceAgentToolkit({
      // Check for both new simplified names AND old names for backward compatibility
      // New simplified names take precedence if both are defined
      merchantId: options.merchantId || process.env.MERCHANT_ID || process.env.VISA_ACCEPTANCE_MERCHANT_ID,
      apiKeyId: options.apiKeyId || process.env.API_KEY_ID || process.env.VISA_ACCEPTANCE_API_KEY_ID,
      secretKey: options.secretKey || process.env.SECRET_KEY || process.env.VISA_ACCEPTANCE_SECRET_KEY,
      environment: options.environment || process.env.VISA_ACCEPTANCE_ENVIRONMENT || 'SANDBOX',
      configuration: toolkitConfig
    });

    // Create a StdioServerTransport and connect the server
    console.error('Starting MCP server...');
    const serverTransport = new StdioServerTransport();
    await mcpServer.connect(serverTransport);
    console.error('Connected to stdio transport');

    // We use console.error instead of console.log since console.log will output to stdio
    console.error(green('✅ Visa Acceptance MCP server running on stdio'));
    
    // Safely display registered tools
    const registeredTools: string[] = [];
    if (toolkitConfig.actions && toolkitConfig.actions.invoices) {
      if (toolkitConfig.actions.invoices.create) registeredTools.push('invoices.create');
      if (toolkitConfig.actions.invoices.list) registeredTools.push('invoices.list');
      if (toolkitConfig.actions.invoices.get) registeredTools.push('invoices.get');
      if (toolkitConfig.actions.invoices.update) registeredTools.push('invoices.update');
    }
    
    console.error(green(`✅ Registered tools: ${registeredTools.join(', ')}`));

    if (options.environment === 'SANDBOX' || process.env.VISA_ACCEPTANCE_ENVIRONMENT === 'SANDBOX') {
      console.error(yellow(`⚠️ Running in SANDBOX ENVIRONMENT`));
    } else {
      console.error(yellow('⚠️ Running in PRODUCTION ENVIRONMENT'));
    }
  } catch (error) {
    handleError(error);
  }
}

// If invoked directly, start the server
if (require.main === module) {
  main().catch((error) => {
    handleError(error);
  });
}