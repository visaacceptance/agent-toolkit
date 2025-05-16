# Visa Acceptance Agent Toolkit

The Visa Acceptance Agent Toolkit enables popular agent frameworks including OpenAI's Agent SDK, Vercel's AI SDK, and Model Context Protocol (MCP) to integrate with Visa Acceptance APIs through function calling. The library provides tools for invoice management and payment operations specifically for Visa Acceptance services, with support for customer information and enhanced invoice parameters.

Included below are basic instructions, but refer to the [TypeScript](/typescript) package for more information.

## TypeScript

### Installation

You don't need this source code unless you want to modify the package. If you just
want to use the package run:

```sh
npm install @visaacceptance/agent-toolkit
```

#### Requirements

- Node 18+

### Usage

The library needs to be configured with your Visa Acceptance account credentials which are available in your Visa Acceptance Dashboard. It supports both simplified environment variable names (MERCHANT_ID, API_KEY_ID, SECRET_KEY) and legacy names (VISA_ACCEPTANCE_*) for backward compatibility.

```typescript
import { VisaAcceptanceAgentToolkit } from "@visaacceptance/agent-toolkit/ai-sdk";

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

The toolkit works with Vercel's AI SDK and can be passed as a list of tools. For example:

```typescript
import { AI } from "@vercel/ai";

const tools = visaAcceptanceAgentToolkit.getTools();

const ai = new AI({
  tools,
});

// Use the tools with Vercel AI SDK
const response = await ai.run({
  messages: [{ role: 'user', content: 'Create an invoice for $100' }],
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
      useTestEnvironment: true,
    },
  },
});
```

## Model Context Protocol

The Visa Acceptance Agent Toolkit also supports the [Model Context Protocol (MCP)](https://modelcontextprotocol.com/).

To run the Visa Acceptance MCP server using npx, use the following command:

```bash
npx -y @visaacceptance/mcp --tools=all --merchant-id=YOUR_MERCHANT_ID --api-key-id=YOUR_API_KEY_ID --secret-key=YOUR_SECRET_KEY
```

Replace the credential placeholders with your actual Visa Acceptance credentials. Or, you could set these values in your environment variables.

Alternatively, you can set up your own MCP server. For example:

```typescript
import { VisaAcceptanceAgentToolkit } from "@visaacceptance/agent-toolkit/modelcontextprotocol";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

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
  console.error("Visa Acceptance MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
```

## Supported API methods

- [Create an invoice](https://developer.visa-acceptance.com/api/invoices/create)
- [Update an invoice](https://developer.visa-acceptance.com/api/invoices/update)
- [List all invoices](https://developer.visa-acceptance.com/api/invoices/list)
- [Get invoice details](https://developer.visa-acceptance.com/api/invoices/get)
- [Process a refund](https://developer.visa-acceptance.com/api/refunds/process)

## Authentication

The Visa Acceptance Agent Toolkit uses Visa Acceptance API credentials which include:
- Merchant ID
- API Key ID
- Secret Key

These can be obtained from your Visa Acceptance account dashboard. The toolkit supports both simplified environment variable names (MERCHANT_ID, API_KEY_ID, SECRET_KEY) and legacy names (VISA_ACCEPTANCE_MERCHANT_ID, VISA_ACCEPTANCE_API_KEY_ID, VISA_ACCEPTANCE_SECRET_KEY) for backward compatibility.


## License

MIT