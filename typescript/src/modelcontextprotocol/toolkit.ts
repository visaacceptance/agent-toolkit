/* © 2025 Visa.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
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
        environment: options.environment || 'SANDBOX',
        mode: 'modelcontextprotocol'
      };
      this._visaAcceptanceAPI = new VisaAcceptanceAPI(visaContext);

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
