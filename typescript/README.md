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

## Usage

The library needs to be configured with your account's credentials which are available in your Visa Acceptance Dashboard. Additionally, `configuration` enables you to specify the types of actions that can be taken using the toolkit.

```typescript
import {VisaAcceptanceAgentToolkit} from '@visaacceptance/agent-toolkit/ai-sdk';

const visaAcceptanceAgentToolkit = new VisaAcceptanceAgentToolkit({
  merchantId: process.env.MERCHANT_ID!,
  apiKeyId: process.env.API_KEY_ID!,
  secretKey: process.env.SECRET_KEY!,
  configuration: {
    actions: {
      invoices: {
        create: true,
        update: true,
        list: true,
        get: true,
      },
    },
  },
});
```

### Tools

The toolkit works with Vercel's AI SDK and can be passed as a list of tools. For example:

```typescript
import {AI} from '@vercel/ai';

const tools = visaAcceptanceAgentToolkit.getTools();

const ai = new AI({
  tools,
});

// Use the tools with Vercel AI SDK
const response = await ai.run({
  messages: [{ role: 'user', content: 'Create an invoice for $100 for customer John Doe' }],
});
```

#### Context

In some cases you will want to provide values that serve as defaults when making requests. Currently, the environment context value enables you to switch between test and production environments.

```typescript
const visaAcceptanceAgentToolkit = new VisaAcceptanceAgentToolkit({
  merchantId: process.env.MERCHANT_ID!,
  apiKeyId: process.env.API_KEY_ID!,
  secretKey: process.env.SECRET_KEY!,
  configuration: {
    context: {
      environment: 'SANDBOX', // or 'PRODUCTION'
    },
  },
});
```

### Metered billing

For Vercel's AI SDK, you can use middleware to submit billing events for usage. All that is required is the customer ID and the input/output meters to bill.

```typescript
import {VisaAcceptanceAgentToolkit} from '@visaacceptance/agent-toolkit/ai-sdk';
import {openai} from '@ai-sdk/openai';
import {
  generateText,
  experimental_wrapLanguageModel as wrapLanguageModel,
} from 'ai';

const visaAcceptanceAgentToolkit = new VisaAcceptanceAgentToolkit({
  merchantId: process.env.MERCHANT_ID!,
  apiKeyId: process.env.API_KEY_ID!,
  secretKey: process.env.SECRET_KEY!,
  configuration: {
    actions: {
      invoices: {
        create: true,
      },
    },
  },
});

const model = wrapLanguageModel({
  model: openai('gpt-4o'),
  middleware: visaAcceptanceAgentToolkit.middleware({
    billing: {
      customer: 'cus_123',
      meters: {
        input: 'input_tokens',
        output: 'output_tokens',
      },
    },
  }),
});
```

This works with both `generateText` and `generateStream` from the Vercel AI SDK.

### Invoice Creation Example

Here's an example of creating an invoice with customer information and enhanced parameters:

```typescript
import {VisaAcceptanceAgentToolkit} from '@visaacceptance/agent-toolkit/ai-sdk';
import {openai} from '@ai-sdk/openai';
import {generateText} from 'ai';

const visaAcceptanceAgentToolkit = new VisaAcceptanceAgentToolkit({
  merchantId: process.env.MERCHANT_ID!,
  apiKeyId: process.env.API_KEY_ID!,
  secretKey: process.env.SECRET_KEY!,
  configuration: {
    actions: {
      invoices: {
        create: true,
      },
    },
  },
});

const tools = visaAcceptanceAgentToolkit.getTools();

const result = await generateText({
  model: openai('gpt-4o'),
  tools,
  prompt: `Create an invoice for $199.99 for John Doe (john.doe@example.com)
          with description "Premium Subscription" that should be sent immediately via email`,
});

console.log('Invoice creation result:', result);

```

## Model Context Protocol

The Visa Acceptance Agent Toolkit also supports the [Model Context Protocol (MCP)](https://modelcontextprotocol.com/). See `/examples/modelcontextprotocol` for an example. The same configuration options are available, and the server can be run with all supported transports.

```typescript
import {VisaAcceptanceAgentToolkit} from '@visaacceptance/agent-toolkit/modelcontextprotocol';
import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js';

const server = new VisaAcceptanceAgentToolkit({
  merchantId: process.env.MERCHANT_ID!,
  apiKeyId: process.env.API_KEY_ID!,
  secretKey: process.env.SECRET_KEY!,
  configuration: {
    actions: {
      invoices: {
        create: true,
        update: true,
        list: true,
        get: true,
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

Note: Both the new simplified names (MERCHANT_ID, API_KEY_ID, SECRET_KEY) and the old names (VISA_ACCEPTANCE_*) are supported for backward compatibility. The new simplified names take precedence if both are defined.