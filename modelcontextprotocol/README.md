# Visa Acceptance MCP Server

This is a Model Context Protocol (MCP) server that provides Visa Acceptance payment processing capabilities, currently focused on refund functionality.

## Features

- **Refund Processing**: Process full or partial refunds for previous transactions
- **MCP Integration**: Exposes Visa Acceptance functionality via MCP tools
- **Real API Calls**: Always makes real API calls to Visa Acceptance (no simulations)
- **Environment Control**: Easily switch between test and production environments

## Installation

1. Clone the repository
2. Install dependencies:
```bash
cd visa-acceptance-agent-toolkit/modelcontextprotocol
npm install
```

## Configuration

Create a `.env` file in the project root with your Visa Acceptance API credentials:

```
# Visa Acceptance API Credentials
VISA_ACCEPTANCE_MERCHANT_ID=your_merchant_id
VISA_ACCEPTANCE_API_KEY_ID=your_api_key_id
VISA_ACCEPTANCE_SECRET_KEY=your_secret_key

# Environment Configuration
# When true, points to apitest.visa-acceptance.com (non-production)
# When false, points to api.visa-acceptance.com (production)
VISA_ACCEPTANCE_USE_TEST_ENV=true
VISA_ACCEPTANCE_AUTH_TYPE=http_signature
```

You can copy the `.env.template` file to get started:

```bash
cp .env.template .env
```

## Usage

### Starting the MCP Server

```bash
node index.js
```

### Using in Roo

The Visa Acceptance MCP server can be added to your MCP settings configuration file (located in your Claude/Roo app settings):

```json
{
  "mcpServers": {
    "visa-acceptance": {
      "command": "node",
      "args": ["/path/to/visa-acceptance-agent-toolkit/modelcontextprotocol/index.js"],
      "env": {
        "VISA_ACCEPTANCE_MERCHANT_ID": "your_merchant_id",
        "VISA_ACCEPTANCE_API_KEY_ID": "your_api_key_id",
        "VISA_ACCEPTANCE_SECRET_KEY": "your_secret_key",
        "VISA_ACCEPTANCE_USE_TEST_ENV": "true",
        "VISA_ACCEPTANCE_AUTH_TYPE": "http_signature"
      },
      "disabled": false,
      "alwaysAllow": []
    }
  }
}
```

After adding the server to your MCP configuration, you can use the following tool:

- `process_refund`: Process a refund for a previous transaction

Example usage in Claude/Roo:
```
I need to process a refund for transaction ID 6246558305476543904324
```

## Tools

### process_refund

Process a refund for a previous transaction.

**Input Parameters:**
- `transaction_id` (required): The ID of the transaction to refund
- `amount` (optional): The amount to refund. If not provided, a full refund will be processed

**Example Success Response:**
```json
{
  "success": true,
  "id": "5678901234567890",
  "status": "PENDING",
  "processor_response": "100",
  "transaction_id": "6246558305476543904324",
  "amount": 50.00,
  "created": "2025-03-18T20:15:30.123Z"
}
```

**Example Error Response:**
```json
{
  "success": false,
  "error": "Transaction not found",
  "transaction_id": "invalid_transaction_id"
}
```

## Testing

You can test the refund functionality directly using the included test script:

```bash
node direct-refund-test.js [transaction_id] [amount]
```

This will:
1. Load your environment variables from .env
2. Connect directly to the Visa Acceptance API
3. Process a refund with the specified transaction ID and amount
4. Display the results

For testing the MCP server implementation:
```bash
node test-mcp-refund.js [transaction_id] [amount]
```

For example:
```bash
# Process a $40 refund for a specific transaction
node direct-refund-test.js 7423472032006126403813 40
```

The test environment (`apitest.visa-acceptance.com`) is used by default. The successful response includes the new refund transaction ID and status.

## License

MIT
