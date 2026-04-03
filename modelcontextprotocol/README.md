# Visa Acceptance Model Context Protocol

The Visa Acceptance [Model Context Protocol](https://modelcontextprotocol.io/) server allows you to integrate with Visa Acceptance APIs through function calling. This protocol supports various tools to interact with different Visa Acceptance services, including enhanced invoice management, and payment links functionality.

## Local Development

This package depends on `@visaacceptance/agent-toolkit`. For local development setup and package linking instructions, see the [Local Development](https://github.com/visaacceptance/agent-toolkit/blob/main/README.md#local-development) section in the root README.

## Usage

To run the Visa Acceptance MCP server using npx, use the following command:

```bash
# To set up all available tools
npx -y @visaacceptance/mcp --tools=all --merchant-id=YOUR_MERCHANT_ID --api-key-id=YOUR_API_KEY_ID --secret-key=YOUR_SECRET_KEY

# To set up specific tool actions
npx -y @visaacceptance/mcp --tools=invoices.create,invoices.read,paymentLinks.create,paymentLinks.read --merchant-id=YOUR_MERCHANT_ID --api-key-id=YOUR_API_KEY_ID --secret-key=YOUR_SECRET_KEY

# To configure test environment (default is SANDBOX)
npx -y @visaacceptance/mcp --tools=all --merchant-id=YOUR_MERCHANT_ID --api-key-id=YOUR_API_KEY_ID --secret-key=YOUR_SECRET_KEY --environment=SANDBOX
```

Make sure to replace the credential placeholders with your actual Visa Acceptance credentials. Alternatively, you could set these values in your environment variables.

### Usage with Claude Desktop

Add the following to your `claude_desktop_config.json`. See [here](https://modelcontextprotocol.io/quickstart/user) for more details.

```json
{
  "mcpServers": {
    "visa-acceptance": {
      "command": "npx",
      "args": [
          "-y",
          "@visaacceptance/mcp",
          "--tools=all",
          "--merchant-id=YOUR_MERCHANT_ID",
          "--api-key-id=YOUR_API_KEY_ID",
          "--secret-key=YOUR_SECRET_KEY"
      ]
    }
  }
}
```

## Available Tool Permissions
You can also supply any list of these tool permissions for the `tools` parameter above, based on the operation(s)
associated with each permission.

| Tool Permission         | Associated Tools                                                           |
| ----------------------- | -------------------------------------------------------------------------- |
| `invoices.create`       | `create_invoice`                                                           |
| `invoices.read`         | `get_invoice`, `list_invoices`                                             |
| `invoices.update`       | `update_invoice`, `send_invoice`, `cancel_invoice`                         |
| `paymentLinks.create`   | `create_payment_link`                                                      |
| `paymentLinks.read`     | `get_payment_link`, `list_payment_links`                                   |
| `paymentLinks.update`   | `update_payment_link`                                                      |

## Debugging the Server

To debug your server, you can use the [MCP Inspector](https://modelcontextprotocol.io/docs/tools/inspector).

First build the server

```bash
npm run build
```

Run the following command in your terminal:

```bash
# Start MCP Inspector and server with all tools
npx @modelcontextprotocol/inspector node dist/index.js --tools=all --merchant-id=YOUR_MERCHANT_ID --api-key-id=YOUR_API_KEY_ID --secret-key=YOUR_SECRET_KEY
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
# Both simplified names and verbose names are supported
# Simplified names take precedence if both are defined
MERCHANT_ID=your_merchant_id
API_KEY_ID=your_api_key_id
SECRET_KEY=your_secret_key
# Verbose format (also supported)
# VISA_ACCEPTANCE_MERCHANT_ID=your_merchant_id
# VISA_ACCEPTANCE_API_KEY_ID=your_api_key_id
# VISA_ACCEPTANCE_SECRET_KEY=your_secret_key

# Environment Configuration
# When SANDBOX, points to non-production endpoint
# When PRODUCTION, points to production endpoint
VISA_ACCEPTANCE_ENVIRONMENT=SANDBOX

# Tools Configuration
VISA_ACCEPTANCE_TOOLS=all
```
