# Visa Acceptance Agent Toolkit

## Quick Example: Creating a Payment Link

```typescript
import { openAiClient } from '@mcp/ai-sdk';

async function createPaymentLink() {
  const response = await openAiClient.callTool('create-payment-link', {
    linkType: 'PURCHASE',
    purchaseNumber: 'YOUR_PURCHASE_NUMBER',
    currency: 'USD',
    totalAmount: '10.00',
    lineItems: [
      {
        productName: 'Example Product',
        quantity: '1',
        unitPrice: '10.00',
        totalAmount: '10.00'
      }
    ]
  });
  console.log('Created payment link:', response);
}
```

The Visa Acceptance Agent Toolkit is a library designed to help AI assistants interact with the Visa Acceptance API through the Model Context Protocol (MCP). It provides tools that make it easy to perform payment operations with Visa Acceptance, currently focused on refund processing.

## Features

- Process refunds for transactions
- Built-in test mode for development without making real API calls
- MCP integration for AI model function calling
- Comprehensive error handling and logging

## Implementations

### TypeScript

The TypeScript implementation provides an MCP server that can be used with any MCP-compatible client to process refunds through the Visa Acceptance API.

Key features:
- Full MCP server implementation
- Command-line interface for easy setup
- Environment variable support
- Test mode for development
- Comprehensive logging

[See TypeScript README](./typescript/README.md)

## Authentication

The Visa Acceptance Agent Toolkit uses Visa Acceptance API credentials which include:
- Merchant ID
- API Key ID 
- Secret Key

These can be obtained from your Visa Acceptance account dashboard.

## Getting Started

### Prerequisites

- Node.js 16.x or higher
- npm or yarn package manager
- Visa Acceptance API credentials

### Installation

From the TypeScript directory:

```bash
cd typescript
npm install
npm run build
```

### Configuration

Create a `.env` file based on the provided template:

```bash
cp .env.template .env
```

Edit the `.env` file with your Visa Acceptance API credentials.

### Running the MCP Server

```bash
npm start
```

Or with command-line arguments:

```bash
npm start -- --merchant-id=your_merchant_id --api-key-id=your_api_key_id --secret-key=your_secret_key
```

### Testing Refund Functionality

A test script is provided to validate refund processing:

```bash
node test-refund.js <transaction_id> [amount]
```

### Quick Start for the MCP Server

Here is a quick guide to set up and run this MCP server:

1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure your environment variables (e.g., VISA_ACCEPTANCE_MERCHANT_ID, VISA_ACCEPTANCE_API_KEY_ID, VISA_ACCEPTANCE_SECRET_KEY).
3. To start the MCP server, run:
   ```bash
   npm start
   ```
4. The server should now be running on stdio and ready to process MCP tool requests.
5. You can invoke available tools (e.g. create_payment_link, process_refund) by sending MCP tool requests to the server.

## Supported Tools

The Visa Acceptance Agent Toolkit currently supports these MCP Tools:

1. process_refund  
   Processes a refund for a transaction.
2. greeting  
   Returns a greeting message.
3. checkout.create_context  
   Creates a capture context for payment processing.
4. create_payment_link  
   Creates a pay-by-link for a specified purchase.
5. create_invoice  
   Creates an invoice using the Visa Acceptance Node.js SDK for invoice creation.

## MCP Toolkit Support

This library supports the Model Context Protocol (MCP), enabling easy integration with Visa Acceptance for creating and managing payment links, processing refunds, and more. For more usage details, see the TypeScript examples and readme.

## License

MIT
