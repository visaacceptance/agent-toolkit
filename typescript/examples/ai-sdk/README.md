# Visa Acceptance Agent Toolkit AI SDK Example

This example demonstrates how to use the Visa Acceptance Agent Toolkit with the AI SDK to create AI-powered invoice experiences with customer information and enhanced invoice parameters.

## Overview

This example shows how to:
- Initialize the Visa Acceptance Agent Toolkit
- Configure the AI SDK with OpenAI
- Use AI to generate invoices based on natural language prompts
- Include customer information (name, email) in invoices
- Add enhanced invoice parameters (description, sendImmediately, deliveryMode)

## Prerequisites

- Node.js v18 or higher
- npm or yarn
- Visa Acceptance merchant account with API credentials

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file in the root directory with your Visa Acceptance credentials:

```
# You can use either simplified names (recommended)
MERCHANT_ID=your_merchant_id
API_KEY_ID=your_api_key_id
SECRET_KEY=your_secret_key

# Or legacy names (also supported)
# VISA_ACCEPTANCE_SECRET_KEY=your_secret_key
# VISA_ACCEPTANCE_MERCHANT_ID=your_merchant_id
# VISA_ACCEPTANCE_API_KEY_ID=your_api_key_id
```

Replace the placeholder values with your actual Visa Acceptance credentials.

## Usage

Run the example:

```bash
npm start
```

This will execute the `index.ts` file, which:
1. Initializes the Visa Acceptance Agent Toolkit with your credentials
2. Sets up the AI SDK with OpenAI
3. Processes a natural language prompt to create an invoice
4. Outputs the result to the console

## Example Code

The main functionality is in `index.ts`:

```typescript
// Import directly from the toolkit file
import VisaAcceptanceAgentToolkit from '../../src/ai-sdk/toolkit';

// Initialize the Visa Acceptance agent
const visaAcceptanceAgentToolkit = new VisaAcceptanceAgentToolkit(
  process.env.VISA_ACCEPTANCE_SECRET_KEY,
  process.env.VISA_ACCEPTANCE_MERCHANT_ID,
  process.env.VISA_ACCEPTANCE_API_KEY_ID,
  configuration
);

async function aiGeneratedInvoice() {
  const userPrompt = `Create an invoice for Ski Resort Package priced at $499.99 for customer Jane Smith (jane.smith@example.com)`;

  const result = await generateText({
    model: openai('gpt-4o'),
    tools: {
      ...visaAcceptanceAgentToolkit.getTools(),
    },
    maxSteps: 5,
    prompt: userPrompt,
  });

  console.log('AI result:', result);
}
```

## Customization

You can modify the `userPrompt` in `index.ts` to create different types of invoices with various parameters. For example:

```typescript
// Basic invoice
const userPrompt = `Create an invoice for a Premium Subscription at $19.99/month`;

// With customer information
const userPrompt = `Create an invoice for John Doe (john@example.com) for a Premium Subscription at $19.99/month`;

// With enhanced invoice parameters
const userPrompt = `Create an invoice for a Premium Subscription at $19.99/month with description "Monthly premium access"
                    that should be sent immediately via email`;

// With all parameters
const userPrompt = `Create an invoice for John Doe (john@example.com) for a Premium Subscription at $19.99/month
                    with description "Monthly premium access" that should be sent immediately via email`;
```

The toolkit will automatically extract the relevant information from the natural language prompt and use it to populate the invoice parameters:

```typescript
// Example of parameters extracted from the prompt
{
  invoice_number: "INV-12345", // Generated automatically
  currency: "USD",
  totalAmount: "19.99",
  customer_name: "John Doe",
  customer_email: "john@example.com",
  invoiceInformation: {
    description: "Monthly premium access",
    sendImmediately: true,
    deliveryMode: "email"
  }
}
```

## Additional Resources

- [Visa Acceptance API Documentation](https://developer.cybersource.com/api/reference/api-reference.html)
- [AI SDK Documentation](https://sdk.vercel.ai/docs)