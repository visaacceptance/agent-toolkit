import { ActivityHandler, MessageFactory } from 'botbuilder';
import axios from 'axios';
import { URL } from 'url';
import * as https from 'https';
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";


export class VisaAcceptanceBot extends ActivityHandler {
    private accessToken: string = '';
    private headers: Record<string, string>;
    private Hostname: string = 'https://genai-api.visa.com';
    private CHAT_MODEL_NAME: string = 'claude-3-7-sonnet-20250219';
    private httpsAgent = new https.Agent({ rejectUnauthorized: false });
    private transport: StdioClientTransport | null = null;
    private tools = [];

    private mcp: Client;


    constructor() {
        super();

        // Set environment variables similar to visa-genai-index.ts
        process.env.REQUESTS_CA_BUNDLE = 'c:/Users/jbrans/repos/test/cacerts.pem';
        process.env.no_proxy = '.visa.com';
        this.mcp = new Client({ name: "mcp-client-cli", version: "1.0.0" });
        this.connectToServer('c:/Users/jbrans/repos/agent-toolkit/modelcontextprotocol/index.js')
        
        // Prepare headers
        this.headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };

        // Immediately attempt login on startup
        this.login().then(() => {
            console.log('Login success');
        }).catch((error) => {
            console.error('Error in login: ', error);
        });

        // Overwrite onMessage to forward user input to Visa Gen AI
        this.onMessage(async (context, next) => {
            try {
                // Ensure we have a valid login before processing
                if (!this.accessToken) {
                    await this.login();
                }

                const userMessage = context.activity.text || '';
                console.log("User message: ", userMessage);

                // 1) Validate token
                await axios.get(`${this.Hostname}/genai-api/v1/auth/validate`, {
                    headers: this.headers,
                    httpsAgent: this.httpsAgent
                });

                // 2) Get list of applications
                await axios.get(`${this.Hostname}/genai-api/v1/applications/`, {
                    headers: this.headers,
                    httpsAgent: this.httpsAgent
                });

                // 3) Construct request payload for the chat endpoint
                const chatData = {
                    model: this.CHAT_MODEL_NAME,
                    application_name: 'HACKATHON',
                    messages: [
                        { role: 'user', content: userMessage }
                    ],
                    tools: this.tools
                };

                console.log('Sending chat data: ', chatData);

                // 4) Submit the request to the Gen AI chat endpoint
                const response = await axios.post(
                    `${this.Hostname}/v1/messages`,
                    chatData,
                    { headers: this.headers, httpsAgent: this.httpsAgent }
                );
                console.log('Raw response: ', response.data, ' response content ', response?.data.content);

                // 5) Parse and respond with the AI's reply
            const modelResponse = response.data?.full_model_response?.content ?? response.data.content.text;

            if (Array.isArray(modelResponse) && modelResponse.length > 0 && modelResponse[0].text) {
                const aiReply = modelResponse[0].text;
                await context.sendActivity(MessageFactory.text(aiReply));
            } else if(response.data.content[1]){
            var toolToUse = response.data.content[1].name;
            var toolArgs = response.data.content[1].input; 
            console.log("Tool to use:", toolToUse);
            console.log("Tool arguments:", toolArgs);
            const mcpResponse = await this.mcp.callTool({
              name: toolToUse,
              arguments: toolArgs

});
console.log("Search transactions response:", JSON.stringify(mcpResponse, null, 2));
await context.sendActivity(MessageFactory.text(JSON.stringify(mcpResponse)));
}else {
    await context.sendActivity(MessageFactory.text('No response received from AI.'));
}
            } catch (error) {
                console.error('Error calling Visa Gen AI endpoint: ', error);
                await context.sendActivity(MessageFactory.text('Error fetching AI response. Please try again later.'));
            }

            await next();
        });

        // Keep a welcome message for any new members
        this.onMembersAdded(async (context, next) => {
            const membersAdded = context.activity.membersAdded;
            const welcomeText = 'Hello and welcome! You can chat directly with the Visa Acceptance Bot. Ask anything!';
            for (const member of membersAdded) {
                if (member.id !== context.activity.recipient.id) {
                    await context.sendActivity(MessageFactory.text(welcomeText, welcomeText));
                }
            }
            await next();
        });
    }

    // Helper to log in and get an access token
    private async login(): Promise<void> {
        try {
            const data = {
                username: 'jbrans',
                password: 'cLzb0fw7aCX-x[?'
            };
            const response = await axios.post(
                `${this.Hostname}/genai-api/v1/auth/login`,
                data,
                { headers: this.headers, httpsAgent: this.httpsAgent }
            );
            this.accessToken = response.data['access_token'];
            this.headers = {
                ...this.headers,
                Authorization: `Bearer ${this.accessToken}`
            };
        } catch (error) {
            throw error;
        }
    }

    async connectToServer(serverScriptPath: string) {
        try {
          const isJs = serverScriptPath.endsWith(".js");
          const isPy = serverScriptPath.endsWith(".py");
          if (!isJs && !isPy) {
            throw new Error("Server script must be a .js or .py file");
          }
          const command = isPy
            ? process.platform === "win32"
              ? "python"
              : "python3"
            : process.execPath;
        
          this.transport = new StdioClientTransport({
            command,
            args: [serverScriptPath],
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
          this.mcp.connect(this.transport);
          
          var toolsResult = await this.mcp.listTools();
          this.tools = [
            {
              type: 'function',
              function: {
                name: 'search_transactions',
                description: 'Search for transactions in Cybersource by providing an advanced query string, e.g. "submitTimeUtc:[NOW/DAY-7DAYS TO NOW/DAY+1DAY}". Example of grabbing transactions from past day submitTimeUtc:[NOW/DAY-1DAYS TO NOW/DAY+1DAY}',
                parameters: {
                  type: 'object',
                  properties: {
                    query: {
                        type: 'string',
                        description: 'Cybersource advanced query',
                      }
                  },
                  required: [],
                  additionalProperties: false
                }
              }
            }
          ];
        //    this.tools = toolsResult.tools.map((tool) => {
        //     return {
        //         type: 'function',
        //         function: {
        //             name: tool.name,
        //             description: tool.description,
        //             parameters: tool.inputSchema,
        //             additionalProperties: false
        //         }
        //     };
        //   });
          console.log(
            "Connected to server with tools:",
            this.tools.map(({ name, parameters }) => name + ": " + parameters).join(", ")
          );
        } catch (e) {
          console.log("Failed to connect to MCP server: ", e);
          throw e;
        }
      }
}
