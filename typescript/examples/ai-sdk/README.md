# Visa Acceptance Agent Toolkit AI SDK Example

This example demonstrates how to use the Visa Acceptance Agent Toolkit with the AI SDK to create AI-powered payment links.

## Overview

This example shows how to:
- Initialize the Visa Acceptance Agent Toolkit
- Configure the AI SDK with OpenAI
- Use AI to generate payment links based on natural language prompts

## Prerequisites

- Node.js v18 or higher
- npm or yarn
- Visa Acceptance merchant account with API credentials

## Setup

1. For local development with the agent-toolkit, follow the [Local Development](https://github.com/visaacceptance/agent-toolkit/blob/main/README.md#local-development) instructions in the root README to set up package linking.

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file by duplicating the `.env.template` file and fill in your Visa Acceptance credentials and OpenAI settings.

## Usage

Run the example:

```bash
npm start
```

This will execute the `index.ts` file, which:
1. Initializes the Visa Acceptance Agent Toolkit with your credentials
2. Sets up the AI SDK with OpenAI
3. Processes a natural language prompt to create a payment link
4. Outputs the result to the console
