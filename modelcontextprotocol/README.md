# Visa Acceptance Model Context Protocol

The Visa Acceptance [Model Context Protocol](https://modelcontextprotocol.com/) server allows you to integrate with Visa Acceptance APIs through function calling. This protocol supports various tools to interact with different Visa Acceptance services.

## Setup

To run the Visa Acceptance MCP server using npx, use the following command:

```bash
# To set up all available tools
npx -y @visa/acceptance-mcp --tools=all --merchant-id=YOUR_MERCHANT_ID --api-key-id=YOUR_API_KEY_ID --secret-key=YOUR_SECRET_KEY

# To set up specific tools
npx -y @visa/acceptance-mcp --tools=invoices.create,invoices.list,invoices.get --merchant-id=YOUR_MERCHANT_ID --api-key-id=YOUR_API_KEY_ID --secret-key=YOUR_SECRET_KEY

# To configure test environment (default is true)
npx -y @visa/acceptance-mcp --tools=all --merchant-id=YOUR_MERCHANT_ID --api-key-id=YOUR_API_KEY_ID --secret-key=YOUR_SECRET_KEY --use-test-env=true
```

Make sure to replace the credential placeholders with your actual Visa Acceptance credentials. Alternatively, you could set these values in your environment variables.

### Usage with Claude Desktop

Add the following to your `claude_desktop_config.json`. See [here](https://modelcontextprotocol.io/quickstart/user) for more details.

```
{
  "mcpServers": {
    "visa-acceptance": {
      "command": "npx",
      "args": [
          "-y",
          "@visa/acceptance-mcp",
          "--tools=all",
          "--merchant-id=YOUR_MERCHANT_ID",
          "--api-key-id=YOUR_API_KEY_ID",
          "--secret-key=YOUR_SECRET_KEY"
      ]
    }
  }
}
```

or if you're using Docker

```
{
    "mcpServers": {
        "visa-acceptance": {
            "command": "docker",
            "args": [
                "run",
                "--rm",
                "-i",
                "mcp/visa-acceptance",
                "--tools=all",
                "--merchant-id=YOUR_MERCHANT_ID",
                "--api-key-id=YOUR_API_KEY_ID",
                "--secret-key=YOUR_SECRET_KEY"
            ]
        }
    }
}
```

## Available tools

| Tool                   | Description                     |
| ---------------------- | ------------------------------- |
| `invoices.create`      | Create a new invoice            |
| `invoices.update`      | Update an existing invoice      |
| `invoices.list`        | List invoices                   |
| `invoices.get`         | Get invoice details             |
| `refunds.process`      | Process a refund transaction    |

## Debugging the Server

To debug your server, you can use the [MCP Inspector](https://modelcontextprotocol.io/docs/tools/inspector).

First build the server

```
npm run build
```

Run the following command in your terminal:

```bash
# Start MCP Inspector and server with all tools
npx @modelcontextprotocol/inspector node dist/index.js --tools=all --merchant-id=YOUR_MERCHANT_ID --api-key-id=YOUR_API_KEY_ID --secret-key=YOUR_SECRET_KEY
```

### Build using Docker

First build the server

```
docker build -t mcp/visa-acceptance .
```

Run the following command in your terminal:

```bash
docker run -p 3000:3000 -p 5173:5173 -v /var/run/docker.sock:/var/run/docker.sock mcp/inspector docker run --rm -i mcp/visa-acceptance --tools=all --merchant-id=YOUR_MERCHANT_ID --api-key-id=YOUR_API_KEY_ID --secret-key=YOUR_SECRET_KEY
```

### Instructions

1. Replace the credential placeholders with your actual Visa Acceptance credentials.
2. Run the command to start the MCP Inspector.
3. Open the MCP Inspector UI in your browser and click Connect to start the MCP server.
4. You can see the list of tools you selected and test each tool individually.

## Configuration

You can also configure the server using environment variables:

```
# Visa Acceptance API Credentials
# Both new simplified names and old names are supported
# New simplified names take precedence if both are defined
MERCHANT_ID=your_merchant_id
API_KEY_ID=your_api_key_id
SECRET_KEY=your_secret_key
# Legacy format (also supported)
# VISA_ACCEPTANCE_MERCHANT_ID=your_merchant_id
# VISA_ACCEPTANCE_API_KEY_ID=your_api_key_id
# VISA_ACCEPTANCE_SECRET_KEY=your_secret_key

# Environment Configuration
# When true, points to apitest.visa-acceptance.com (non-production)
# When false, points to api.visa-acceptance.com (production)
VISA_ACCEPTANCE_USE_TEST_ENV=true
VISA_ACCEPTANCE_AUTH_TYPE=http_signature

# Tools Configuration
# Both formats are supported, new simplified name takes precedence
ACCEPTANCE_TOOLS=all
# VISA_ACCEPTANCE_TOOLS=all
```

You can copy the `.env.template` file to get started:

```bash
cp .env.template .env