#!/usr/bin/env node

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import dotenv from 'dotenv';
import { green, yellow, red } from 'colors';
import { VisaAcceptanceAgentToolkit } from '@visaacceptance/agent-toolkit';


dotenv.config();

/**
 * Main configuration type for the Visa Acceptance MCP server
 */
type ToolkitConfig = {
  actions: {
    [product: string]: {[action: string]: boolean};
  };
  context?: {
    account?: string;
    mode: 'modelcontextprotocol';
  };
};

const ACCEPTED_ARGS = ['merchant-id', 'api-key-id', 'secret-key', 'environment', 'tools'];

const ACCEPTED_TOOLS = [
  'invoices.create',
  'invoices.read',
  'invoices.update',
  'paymentLinks.create',
  'paymentLinks.update',
  'paymentLinks.read'
];

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
    const options = parseArgs(process.argv.slice(2));

    const toolsFromEnv = process.env.ACCEPTANCE_TOOLS ?
      process.env.ACCEPTANCE_TOOLS.split(',') :
      process.env.VISA_ACCEPTANCE_TOOLS ?
        process.env.VISA_ACCEPTANCE_TOOLS.split(',') :
        undefined;
    
    const selectedTools = options.tools || toolsFromEnv;
    const toolkitConfig: ToolkitConfig = {
      actions: {
        invoices: {}
      }
    };

    if (!selectedTools) {
      throw new Error('No tools specified. Please provide tools via --tools argument or ACCEPTANCE_TOOLS/VISA_ACCEPTANCE_TOOLS environment variable.');
    }

    if (selectedTools.includes('all')) {
      ACCEPTED_TOOLS.forEach((tool) => {
        const [product, action] = tool.split('.');
        toolkitConfig.actions[product] = {
          ...toolkitConfig.actions[product],
          [action]: true,
        };
      });
    } else {
      selectedTools.forEach((tool: string) => {
        const [product, action] = tool.split('.');        
        toolkitConfig.actions[product] = {[action]: true};
      });
    }

    toolkitConfig.context = {
      mode: 'modelcontextprotocol'
    };

    const mcpServer = new VisaAcceptanceAgentToolkit({
      merchantId: options.merchantId || process.env.MERCHANT_ID || process.env.VISA_ACCEPTANCE_MERCHANT_ID,
      apiKeyId: options.apiKeyId || process.env.API_KEY_ID || process.env.VISA_ACCEPTANCE_API_KEY_ID,
      secretKey: options.secretKey || process.env.SECRET_KEY || process.env.VISA_ACCEPTANCE_SECRET_KEY,
      environment: options.environment || process.env.VISA_ACCEPTANCE_ENVIRONMENT || 'SANDBOX',
      configuration: toolkitConfig
    });

    console.error('Starting MCP server...');
    const serverTransport = new StdioServerTransport();
    await mcpServer.connect(serverTransport);
    console.error('Connected to stdio transport');

    console.error(green('✅ Visa Acceptance MCP server running on stdio'));

    if (options.environment === 'SANDBOX' || process.env.VISA_ACCEPTANCE_ENVIRONMENT === 'SANDBOX') {
      console.error(yellow(`⚠️ Running in SANDBOX ENVIRONMENT`));
    } else {
      console.error(yellow('⚠️ Running in PRODUCTION ENVIRONMENT'));
    }
  } catch (error) {
    handleError(error);
  }
}

if (require.main === module) {
  main().catch((error) => {
    handleError(error);
  });
}