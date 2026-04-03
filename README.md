# Visa Acceptance Agent Toolkit

The Visa Acceptance Agent Toolkit seamlessly integrates with Vercel's AI SDK and the Model Context Protocol (MCP) for Visa Acceptance APIs. It offers a specialized set of tools designed to help you manage invoices, create payment links, and perform other Visa Acceptance-related operations.

## TypeScript

### Installation

If you simply want to use the toolkit without modifying its source code, install it via:

```sh
npm install @visaacceptance/agent-toolkit
```

#### Requirements

- Node 18+

### Local Development

This repository contains multiple packages:
- **@visaacceptance/agent-toolkit** (`typescript/`): The core toolkit library
- **@visaacceptance/mcp** (`modelcontextprotocol/`): MCP server implementation (depends on @visaacceptance/agent-toolkit)
- **visa-acceptance-agent-toolkit-ai-sdk-example** (`typescript/examples/ai-sdk/`): Example implementation (depends on @visaacceptance/agent-toolkit)

For local development, use npm linking to connect these packages:

1. **Link the agent-toolkit**:
   ```bash
   cd typescript
   npm install
   npm run build
   npm run link
   ```

2. **Link dependent packages**:
   ```bash
   # For @visaacceptance/mcp
   cd ../modelcontextprotocol
   npm install
   npm run link
   npm run build

   # For ai-sdk example
   cd ../typescript/examples/ai-sdk
   npm install
   npm run link
   ```

Now changes to the agent-toolkit will be immediately available in the dependent packages after rebuilding.

### Credentials

Configure the toolkit with your Visa Acceptance account credentials. These credentials can be set using environment variables (`VISA_ACCEPTANCE_MERCHANT_ID`, `VISA_ACCEPTANCE_API_KEY_ID`, `VISA_ACCEPTANCE_SECRET_KEY`).

### Integrating with Vercel's AI SDK

To use this toolkit with Vercel's AI SDK:

```typescript
import { VisaAcceptanceAgentToolkit } from "@visaacceptance/agent-toolkit/ai-sdk";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const toolkit = new VisaAcceptanceAgentToolkit(
  process.env.VISA_ACCEPTANCE_MERCHANT_ID,
  process.env.VISA_ACCEPTANCE_API_KEY_ID,
  process.env.VISA_ACCEPTANCE_SECRET_KEY,
  "SANDBOX", // or "PRODUCTION"
  {
    actions: {
      invoices: {
        create: true,
      },
    },
  }
);

// Sample usage:
const result = await generateText({
  model: openai("gpt-4o"),
  tools: toolkit.getTools(),
  prompt: "Please create an invoice for $200",
});
```

**Important:** Always test in `SANDBOX` before switching to `PRODUCTION`.

### Integrating with MCP

The [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) is also supported. You can run a Visa Acceptance MCP server with:

```bash
npx -y @visaacceptance/mcp --tools=all --merchant-id=YOUR_MERCHANT_ID --api-key-id=YOUR_API_KEY_ID --secret-key=YOUR_SECRET_KEY
```

For additional setup information and configuration options, see the [MCP documentation](modelcontextprotocol/README.md).


## Supported Tools

The toolkit currently provides the following Visa Acceptance operations:

- **Invoices**  
  - `create_invoice` - Create a new invoice with customer information and payment details
  - `update_invoice` - Update an existing invoice including customer and invoice information
  - `get_invoice` - Retrieve detailed information about a specific invoice
  - `list_invoices` - List invoices with pagination support
  - `send_invoice` - Send an invoice to the customer via email
  - `cancel_invoice` - Cancel an existing invoice

- **Payment Links**  
  - `create_payment_link` - Create a new payment link with customizable line items and payment options
  - `update_payment_link` - Update an existing payment link by its ID
  - `get_payment_link` - Retrieve details of a specific payment link
  - `list_payment_links` - List payment links with pagination support


## DISCLAIMER
AI-generated content may be inaccurate or incomplete. Users are fully responsible for verifying any information before relying on it, especially for financial decisions. Visa Acceptance is not liable for any usage, decisions, or damages resulting from AI outputs or this toolkit.

### Agent Toolkit Disclaimer
The Agent Toolkit is a SDK provided as a developer tool to facilitate integration of select Visa APIs with large language models (LLMs) or AI services used or accessed by Agent Toolkit licensees. No LLMs or AI services are provided or delivered by Visa through the Agent Toolkit. Licensees of the Agent Toolkit are solely responsible for selecting, procuring, licensing or otherwise obtaining access to, configuring, and maintaining their own LLMs, AI services, and data sources.

### MCP Server Disclaimer
This Model Context Protocol (MCP) server is  provided in conjunction with the Agent Toolkit SDK to facilitate integration of select Visa APIs with large language models (LLMs) or AI services used or accessed by Agent Toolkit licensees. No LLMs or AI services are provided or delivered by Visa through the MCP server or Agent Toolkit. Licensees of the Agent Toolkit are solely responsible for selecting, procuring, licensing or otherwise obtaining access to, configuring, and maintaining their own LLMs, AI services, and data sources.


## License

MIT