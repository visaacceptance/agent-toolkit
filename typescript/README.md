# Visa Acceptance Agent Toolkit - TypeScript

The Visa Acceptance Agent Toolkit enables popular agent frameworks including Vercel's AI SDK to integrate with Visa Acceptance APIs through function calling. It provides tools for invoice management and other Visa Acceptance services, with support for customer information and enhanced invoice parameters through real Cybersource API integration.

## Installation

You don't need this source code unless you want to modify the package. If you just
want to use the package run:

```
npm install @visaacceptance/agent-toolkit
```

### Requirements

- Node 18+

### Local Development

For local development setup and package linking instructions, see the [Local Development](https://github.com/visaacceptance/agent-toolkit/blob/main/README.md#local-development) section in the root README.

## AI-SDK Usage

The library needs to be configured with your account's credentials which are available in your Visa Acceptance Dashboard. Additionally, the `configuration` parameter enables you to specify the types of actions that can be taken using the toolkit.

```typescript
import {VisaAcceptanceAgentToolkit} from '@visaacceptance/agent-toolkit/ai-sdk';

const visaAcceptanceAgentToolkit = new VisaAcceptanceAgentToolkit(
  process.env.VISA_ACCEPTANCE_MERCHANT_ID,
  process.env.VISA_ACCEPTANCE_API_KEY_ID,
  process.env.VISA_ACCEPTANCE_SECRET_KEY,
  'SANDBOX', // or 'PRODUCTION'
  {
    actions: {
      invoices: {
        create: true,
        read: true,
        update: true,
      },
    },
  }
);
```

### Tools

The toolkit works with Vercel's AI SDK and can be passed as a list of tools. For example:

```typescript
import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const tools = visaAcceptanceAgentToolkit.getTools();

// Use the tools with Vercel AI SDK
const result = await generateText({
  model: openai('gpt-4o'),
  tools,
  prompt: 'Create an invoice for $100 for customer John Doe',
});
```

### Invoice Creation Example

Here's an example of creating an invoice with customer information and enhanced parameters:

```typescript
import {VisaAcceptanceAgentToolkit} from '@visaacceptance/agent-toolkit/ai-sdk';
import {openai} from '@ai-sdk/openai';
import {generateText} from 'ai';

const visaAcceptanceAgentToolkit = new VisaAcceptanceAgentToolkit(
  process.env.VISA_ACCEPTANCE_MERCHANT_ID,
  process.env.VISA_ACCEPTANCE_API_KEY_ID,
  process.env.VISA_ACCEPTANCE_SECRET_KEY,
  'SANDBOX',
  {
    actions: {
      invoices: {
        create: true,
      },
    },
  }
);

const result = await generateText({
  model: openai('gpt-4o'),
  tools: visaAcceptanceAgentToolkit.getTools(),
  prompt: `Create an invoice for $199.99 for John Doe (john.doe@example.com)
          with description "Premium Subscription" that should be sent immediately via email`,
});

console.log(JSON.stringify(result, null, 2));
```

## Model Context Protocol Usage

The Visa Acceptance Agent Toolkit also supports the [Model Context Protocol (MCP)](https://modelcontextprotocol.io/). See the [`modelcontextprotocol/`](https://github.com/visaacceptance/agent-toolkit/blob/main/modelcontextprotocol/README.md) directory for the MCP server implementation. The same configuration options are available, and the server can be run with all supported transports.

```typescript
import {VisaAcceptanceAgentToolkit} from '@visaacceptance/agent-toolkit/modelcontextprotocol';
import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js';

const server = new VisaAcceptanceAgentToolkit({
  merchantId: process.env.VISA_ACCEPTANCE_MERCHANT_ID,
  apiKeyId: process.env.VISA_ACCEPTANCE_API_KEY_ID,
  secretKey: process.env.VISA_ACCEPTANCE_SECRET_KEY,
  environment: process.env.VISA_ACCEPTANCE_ENVIRONMENT,
  configuration: {
    actions: {
      invoices: {
        create: true,
        read: true,
        update: true,
      },
    },
  },
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Visa Acceptance MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
```

## Configuration

Configuration is loaded from environment variables with fallbacks to default values:

- `VISA_ACCEPTANCE_MERCHANT_ID` - Your Visa Acceptance merchant ID
- `VISA_ACCEPTANCE_API_KEY_ID` - Your Visa Acceptance API key ID
- `VISA_ACCEPTANCE_SECRET_KEY` - Your Visa Acceptance secret key
- `VISA_ACCEPTANCE_ENVIRONMENT` - SANDBOX and PRODUCTION are available environments