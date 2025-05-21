import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {RequestHandlerExtra} from '@modelcontextprotocol/sdk/shared/protocol.js';
import {Configuration, isToolAllowed} from '../shared/configuration';
import { VisaContext } from '../shared/types';
import tools from '../shared/tools';
import VisaAcceptanceAPI from '../shared/api';

class VisaAcceptanceAgentToolkit extends McpServer {
  private _visaAcceptanceAPI: VisaAcceptanceAPI;
  private credentials: {
    secretKey?: string;
    merchantId?: string;
    merchantKeyId?: string;
  };

  constructor(options: {
    merchantId?: string;
    apiKeyId?: string;
    secretKey?: string;
    environment?: string;
    configuration?: Configuration;
  } = {}) {
   
    super({
        name: 'Visa Acceptance',
        version: '0.1.0',
        configuration: {
          ...(options.configuration || {}),
          context: {
            ...(options.configuration?.context || {}),
            mode: 'modelcontextprotocol',
          },
        },
      });
      
      this.credentials = {
        secretKey: options.secretKey || process.env.VISA_ACCEPTANCE_SECRET_KEY,
        merchantId: options.merchantId || process.env.VISA_ACCEPTANCE_MERCHANT_ID,
        merchantKeyId: options.apiKeyId || process.env.VISA_ACCEPTANCE_API_KEY_ID
      };
  
      const visaContext: VisaContext = {
        merchantId: this.credentials.merchantId || '',
        apiKeyId: this.credentials.merchantKeyId || '',
        secretKey: this.credentials.secretKey || '',
        environment: options.environment || 'SANDBOX'
      };
      this._visaAcceptanceAPI = new VisaAcceptanceAPI(visaContext);

    const context = (options.configuration?.context) || {};
    const filteredTools = tools(visaContext).filter((tool) =>
      isToolAllowed(tool, options.configuration || {})
    );

    filteredTools.forEach((tool) => {
      this.tool(
        tool.method,
        tool.description,
        tool.parameters.shape,
        async (arg: any, _extra: RequestHandlerExtra<any, any>) => {
          const result = await this._visaAcceptanceAPI.run(tool.method, arg);
          return {
            content: [
              {
                type: 'text' as const,
                text: String(result),
              },
            ],
          };
        }
      );
    });
  }
}

export default VisaAcceptanceAgentToolkit;
