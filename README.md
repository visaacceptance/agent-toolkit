# Visa Acceptance Agent Toolkit

The Visa Acceptance Agent Toolkit seamlessly integrates with Vercel's AI SDK and the Model Context Protocol (MCP) for Visa Acceptance APIs. It offers a specialized set of tools designed to help you manage invoices, create payment links, and perform other Visa Acceptance-related operations.

## Supported Frameworks

- **Vercel AI SDK** - Full integration with function calling and tool support
- **Model Context Protocol (MCP)** - Complete MCP server implementation
## TypeScript

### Installation

If you simply want to use the toolkit without modifying its source code, install it via:

```sh
npm install @visaacceptance/agent-toolkit
```

#### Requirements

- Node 18+

### Usage

Configure the toolkit with your Visa Acceptance account credentials. These credentials can be set using environment variables (`MERCHANT_ID`, `API_KEY_ID`, `SECRET_KEY`) or legacy naming conventions (`VISA_ACCEPTANCE_MERCHANT_ID`, `VISA_ACCEPTANCE_API_KEY_ID`, `VISA_ACCEPTANCE_SECRET_KEY`).

```typescript
import { VisaAcceptanceAgentToolkit } from "@visaacceptance/agent-toolkit/ai-sdk";

const toolkit = new VisaAcceptanceAgentToolkit({
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
        send: true,
        cancel: true
      },
      paymentLinks: {
        create: true,
        update: true,
        list: true,
        get: true,
      },
    },
  },
});
```

### Integrating with Vercel's AI SDK

To use this toolkit with Vercel's AI SDK:

```typescript
import { AI } from "@vercel/ai";
import { VisaAcceptanceAgentToolkit } from "@visaacceptance/agent-toolkit/ai-sdk";

const toolkit = new VisaAcceptanceAgentToolkit({
  merchantId: process.env.MERCHANT_ID!,
  apiKeyId: process.env.API_KEY_ID!,
  secretKey: process.env.SECRET_KEY!,
  configuration: {
    actions: {
      invoices: {
        create: true,
      }
    },
  },
});

const ai = new AI({
  tools: toolkit.getTools(),
});

// Sample usage:
const response = await ai.run({
  messages: [{ role: "user", content: "Please create an invoice for $200" }],
});
```

### Context

You can set default behaviors or environments via the `configuration.context` block. For example, enabling test environments:

```typescript
const toolkit = new VisaAcceptanceAgentToolkit({
  merchantId: process.env.MERCHANT_ID!,
  apiKeyId: process.env.API_KEY_ID!,
  secretKey: process.env.SECRET_KEY!,
  configuration: {
    context: {
      environment: "SANDBOX",
    },
  },
});
```

## Model Context Protocol

The [Model Context Protocol (MCP)](https://modelcontextprotocol.com/) is also supported. You can run a Visa Acceptance MCP server with:

```bash
npx -y @visaacceptance/mcp --tools=all --merchant-id=YOUR_MERCHANT_ID --api-key-id=YOUR_API_KEY_ID --secret-key=YOUR_SECRET_KEY
```


## Supported API Methods

The toolkit currently provides the following Visa Acceptance operations:

- **Invoices**
  - Create an invoice - Create a new invoice with customer information and enhanced parameters
  - Update an invoice - Update existing invoice details including customer and invoice information
  - List invoices - Retrieve paginated list of invoices with filtering options
  - Get invoice - Retrieve detailed information for a specific invoice
  - Send invoice - Send invoice to customer via email
  - Cancel invoice - Cancel an existing invoice

- **Payment Links**
  - Create a payment link - Create a new payment link with optional shipping information
  - Update a payment link - Update existing payment link details
  - List payment links - Retrieve paginated list of payment links
  - Get payment link - Retrieve details of a specific payment link


## DISCLAIMER
AI-generated content may be inaccurate or incomplete. Users are fully responsible for verifying any information before relying on it, especially for financial decisions. Visa Acceptance is not liable for any usage, decisions, or damages resulting from AI outputs or this toolkit.

## License

MIT