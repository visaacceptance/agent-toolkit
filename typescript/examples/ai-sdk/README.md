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

2. Copy the `.env.template` and populate with your values.

```
cp .env.template .env
```

Replace the placeholder values with your actual Visa Acceptance credentials.

## Usage

Run the example:

```
npx ts-node index.ts --env
```