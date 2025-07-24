#!/usr/bin/env node
/* © 2025 Visa.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */


const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const dotenv = require('dotenv');
const colors = require('colors');
const { green, yellow, red } = colors;
// Import from the typescript package dependency
const { default: VisaAcceptanceAgentToolkit } = require('@visaacceptance/agent-toolkit/modelcontextprotocol');

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
  'paymentLinks.read',
  'paymentLinks.update',

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

    const toolsFromEnv = process.env.VISA_ACCEPTANCE_TOOLS ?
        process.env.VISA_ACCEPTANCE_TOOLS.split(',') :
        undefined;
    
    const selectedTools = options.tools || toolsFromEnv;
    const toolkitConfig: ToolkitConfig = {
      actions: {}
    };

    if (!selectedTools) {
      throw new Error('No tools specified. Please provide tools via --tools argument or ACCEPTANCE_TOOLS/VISA_ACCEPTANCE_TOOLS environment variable.');
    }

    if (selectedTools.includes('all')) {
      ACCEPTED_TOOLS.forEach((tool) => {
        const [product, action] = tool.split('.');

        if (!toolkitConfig.actions[product]) {
          toolkitConfig.actions[product] = {};
        }
        toolkitConfig.actions[product][action] = true;
      });
    } else {
      selectedTools.forEach((tool: string) => {
        const [product, action] = tool.split('.');
        
        // Initialize the product object if it doesn't exist
        if (!toolkitConfig.actions[product]) {
          toolkitConfig.actions[product] = {};
        }
        
        // Add the action directly
        toolkitConfig.actions[product][action] = true;
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

    if (options.environment === 'PRODUCTION' || process.env.VISA_ACCEPTANCE_ENVIRONMENT === 'PRODUCTION') {
      console.error(yellow(`⚠️ Running in PRODUCTION ENVIRONMENT`));
    } else {
      console.error(yellow('⚠️ Running in SANDBOX ENVIRONMENT'));
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

