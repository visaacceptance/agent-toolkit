/* © 2025 Visa.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
/* START GENAI */
import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {RequestHandlerExtra} from '@modelcontextprotocol/sdk/shared/protocol.js';
import {Configuration, isToolAllowed} from '../shared/configuration.js';
import { VisaContext } from '../shared/types.js';
import { tools } from '../shared/tools.js';
import VisaAcceptanceAPI from '../shared/api.js';
import { maskPII } from '../shared/utils/util.js';

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

    const filteredTools = tools(visaContext).filter((tool: any) =>
      isToolAllowed(tool, options.configuration || {})
    );

    filteredTools.forEach((tool: any) => {
      this.tool(
        tool.method,
        tool.description,
        tool.parameters.shape,
        async (arg: any, _extra: RequestHandlerExtra<any, any>) => {
          const result = await this._visaAcceptanceAPI.run(tool.method, arg);
          try {
            // Parse the JSON string to get the actual object
            const parsedResult = JSON.parse(result);
            
            // Apply masking directly here for invoice-related operations
            if (tool.method === 'list_invoices' && parsedResult.invoices && Array.isArray(parsedResult.invoices)) {
              console.error('Applying masking to invoices in toolkit...');
              
              // Apply masking to each invoice's customer information
              parsedResult.invoices.forEach((invoice: any) => {
                if (invoice.customerInformation && invoice.customerInformation.name) {
                  const originalName = invoice.customerInformation.name;
                  invoice.customerInformation.name = maskPII(originalName, 'end');
                  console.error(`Masked name: "${originalName}" -> "${invoice.customerInformation.name}"`);
                }
                
                if (invoice.customerInformation && invoice.customerInformation.email) {
                  const originalEmail = invoice.customerInformation.email;
                  const emailParts = originalEmail.split('@');
                  if (emailParts.length === 2) {
                    const maskedLocalPart = maskPII(emailParts[0], 'end');
                    invoice.customerInformation.email = `${maskedLocalPart}@${emailParts[1]}`;
                  } else {
                    invoice.customerInformation.email = maskPII(originalEmail, 'end');
                  }
                  console.error(`Masked email: "${originalEmail}" -> "${invoice.customerInformation.email}"`);
                }
              });
            }
            
            // Then stringify it again to ensure proper formatting
            return {
              content: [
                {
                  type: 'text' as const,
                  text: JSON.stringify(parsedResult, null, 2),
                },
              ],
            };
          } catch (error) {
            // If parsing fails, return the original result
            console.error('Failed to parse result:', error);
            return {
              content: [
                {
                  type: 'text' as const,
                  text: String(result),
                },
              ],
            };
          }
        }
      );
    });
  }
}

export default VisaAcceptanceAgentToolkit;
/* END GENAI */