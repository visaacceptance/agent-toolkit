# Visa Acceptance Agent Toolkit - MCP Server

This directory contains the TypeScript implementation of the Visa Acceptance Agent Toolkit MCP server.

## Structure

- `index.ts` - Main entry point with command-line argument parsing and server initialization
- `toolkit.ts` - Core `VisaAcceptanceAgentToolkit` class that encapsulates MCP server functionality
- `config.ts` - Configuration handling for Cybersource API
- `types.ts` - Type definitions for the toolkit

## Usage

The toolkit can be used in two ways:

### 1. As a command-line tool

```bash
# Using environment variables
visa-acceptance-mcp

# With command-line arguments
visa-acceptance-mcp --test --merchant-id YOUR_ID --api-key-id YOUR_KEY --secret-key YOUR_SECRET
```

### 2. As a library

```typescript
import { VisaAcceptanceAgentToolkit } from '@visa-acceptance/agent-toolkit-mcp';

// Initialize with options
const toolkit = new VisaAcceptanceAgentToolkit({
  merchantId: 'your-merchant-id',
  apiKeyId: 'your-api-key-id',
  secretKey: 'your-secret-key',
  useTestEnv: true
});

// Connect to MCP server
await toolkit.connect();
```

## Environment Variables

- `VISA_ACCEPTANCE_MERCHANT_ID` - Your Visa Acceptance merchant ID
- `VISA_ACCEPTANCE_API_KEY_ID` - Your Visa Acceptance API key ID
- `VISA_ACCEPTANCE_SECRET_KEY` - Your Visa Acceptance secret key
- `VISA_ACCEPTANCE_USE_TEST_ENV` - Set to 'true' to use test environment (default: 'true')
- `VISA_ACCEPTANCE_AUTH_TYPE` - Authentication type (default: 'http_signature')