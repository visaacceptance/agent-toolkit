# Visa Acceptance Agent Toolkit AI SDK Example

This example demonstrates how to use the Visa Acceptance Agent Toolkit with the AI SDK to create AI-powered payment links.

## Overview

This example shows how to:
- Initialize the Visa Acceptance Agent Toolkit
- Configure the AI SDK with OpenAI
- Use AI to generate payment links based on natural language prompts
- Add payment links

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
