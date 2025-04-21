import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

/**
 * Some servers require a clientInfo object (name, version).
 * Let's include it in our client config to avoid "Required" errors.
 */

async function searchMcpTransactions() {
  try {
    const client = new Client({
      name: "visa-acceptance-bot",
      version: "1.0.0",
      serverName: "cybersource",
      configOverride: {
        command: "node",
        args: ["c:/Users/jbrans/repos/agent-toolkit/modelcontextprotocol/index.js"],
        env: {}
      }
    });
    var command = process.execPath;
    var transport = new StdioClientTransport({
      command,
      args: ["c:/Users/jbrans/repos/agent-toolkit/modelcontextprotocol/index.js"],
      env: {
        "CYBERSOURCE_MOCK_MODE": "false",
        "CYBERSOURCE_MERCHANT_ID": "visa_acceptance_llm_01",
        "CYBERSOURCE_API_KEY_ID": "9809ebfb-e5ce-43af-8f2d-90f65770c4bc",
        "CYBERSOURCE_SECRET_KEY": "K3UY4P0qRlca7fdjzRmVl0yBSefaXZ8OcDhMag9WDtk=",
        "CYBERSOURCE_LOG_DIRECTORY": "c:/Users/jbrans/repos/agent-toolkit/modelcontextprotocol/log",
        "CYBERSOURCE_ENABLE_LOG": "false",
        "CYBERSOURCE_USE_TEST_ENV": "true"
      }
    });

    await client.connect(transport);

    const query = "submitTimeUtc:[NOW/DAY-14DAYS TO NOW/DAY+1DAY]";
    const response = await client.callTool({
      name: "search_transactions",
      arguments: { query: query }
    });

    console.log("Search transactions response:", JSON.stringify(response, null, 2));
  } catch (error) {
    console.error("Error calling search_transactions:", error);
  }
}

// Uncomment to try it:
 searchMcpTransactions();