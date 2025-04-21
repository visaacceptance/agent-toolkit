# Cybersource Agent Toolkit for TypeScript

This toolkit provides a TypeScript implementation for interacting with Cybersource APIs.

## Features

- PayByLink API integration for creating payment links
- TypeScript types for improved developer experience
- Modular design following best practices

## Usage

### Basic Example

```typescript
import { CybersourceAgentToolkit } from './src/ai-sdk';

async function main() {
  // Create an instance of the toolkit
  const toolkit = new CybersourceAgentToolkit();
  
  // Get the payment link creation tool
  const paymentLinkTool = toolkit.getTool('create_payment_link');
  
  if (paymentLinkTool && paymentLinkTool.execute) {
    // Create payment link
    const result = await paymentLinkTool.execute(
      {
        linkType: 'PURCHASE',
        purchaseNumber: 'ORDER123',
        currency: 'USD',
        totalAmount: '42.00',
        lineItems: [
          {
            productName: 'Test Product',
            productSKU: 'TEST-SKU-123',
            description: 'Test product for API',
            quantity: '1',
            unitPrice: '42.00',
            totalAmount: '42.00'
          }
        ]
      },
      {} // Empty options object as second parameter
    );
    
    console.log('Payment link created:', result);
  }
}
```

### Running the Test Example

To run the included test example:

```bash
npx ts-node examples/test-paybylink.ts
```

## API Documentation

### CybersourceAgentToolkit

The main class for accessing Cybersource API functionality.

Methods:
- `getTools()` - Returns all available tools
- `getTool(name)` - Returns a specific tool by name

### Available Tools

- `create_payment_link` - Creates a payment link using Cybersource PayByLink API

## Configuration

Configuration is loaded from environment variables with fallbacks to default values:

- `CYBERSOURCE_MERCHANT_ID` - Your Cybersource merchant ID
- `CYBERSOURCE_API_KEY_ID` - Your Cybersource API key ID
- `CYBERSOURCE_SECRET_KEY` - Your Cybersource secret key
- `CYBERSOURCE_AUTH_TYPE` - Authentication type (default: 'http_signature')

You can also use a .env file in the project root to set these variables.