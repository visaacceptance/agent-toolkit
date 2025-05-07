# Visa Acceptance Agent Toolkit AI SDK Example

This example demonstrates how to use the Visa Acceptance Agent Toolkit with the AI SDK to create AI-powered invoice experiences.

## Overview

This example shows how to:
- Initialize the Visa Acceptance Agent Toolkit
- Configure the AI SDK with OpenAI
- Use AI to generate invoices based on natural language prompts

## Prerequisites

- Node.js v14 or higher
- npm or yarn
- Visa Acceptance merchant account with API credentials

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file in the root directory with your Visa Acceptance credentials:

```
VISA_ACCEPTANCE_SECRET_KEY=your_secret_key
VISA_ACCEPTANCE_MERCHANT_ID=your_merchant_id
VISA_ACCEPTANCE_API_KEY_ID=your_api_key_id
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
// Initialize the Visa Acceptance agent
const cybersourceAgentToolkit = new CybersourceAgentToolkit(
  process.env.VISA_ACCEPTANCE_SECRET_KEY,
  process.env.VISA_ACCEPTANCE_MERCHANT_ID,
  process.env.VISA_ACCEPTANCE_API_KEY_ID,
  configuration
);

async function aiGeneratedInvoice() {
  const userPrompt = `Create an invoice for Ski Resort Package priced at $499.99`;

  const result = await generateText({
    model: openai('gpt-4o'),
    tools: {
      ...cybersourceAgentToolkit.getTools(),
    },
    maxSteps: 5,
    prompt: userPrompt,
  });

  console.log('AI result:', result);
}
```

## Customization

You can modify the `userPrompt` in `index.ts` to create different types of invoices. For example:

```typescript
const userPrompt = `Create an invoice for a Premium Subscription at $19.99/month`;
```

## Additional Resources

- [Visa Acceptance API Documentation](https://developer.cybersource.com/api/reference/api-reference.html)
- [AI SDK Documentation](https://sdk.vercel.ai/docs)