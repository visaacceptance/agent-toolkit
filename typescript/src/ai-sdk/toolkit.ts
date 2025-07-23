/* © 2025 Visa.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
/* START GENAI */
import type { Tool } from 'ai';
import { VisaAcceptanceAPI } from '../shared/api';
import { VisaContext } from '../shared/types';
import VisaAcceptanceTool from './tool';
import { z } from 'zod';
import {isToolAllowed} from '../shared/configuration';
import {Configuration} from '../shared/types';
import { tools } from '../shared/tools';

class VisaAcceptanceAgentToolkit {
  private api: VisaAcceptanceAPI;
  private tools: {[key: string]: Tool};
  private toolMap: Map<string, Tool> = new Map();
  private configuration: Configuration;
  private credentials: {
    
    merchantId?: string;
    merchantKeyId?: string;
    secretKey?: string;
  };

  /**
   * Creates a new Visa Acceptance Agent Toolkit
   * @param options Configuration options 
   */
  constructor( merchantIdTool: string | undefined, merchantKeyIdTool : string | undefined, secretKeyTool: string | undefined, environment?: string, configuration: Configuration = {}) {
    this.credentials = {
      secretKey: secretKeyTool || process.env.VISA_ACCEPTANCE_SECRET_KEY,
      merchantId: merchantIdTool || process.env.VISA_ACCEPTANCE_MERCHANT_ID,
      merchantKeyId: merchantKeyIdTool || process.env.VISA_ACCEPTANCE_API_KEY_ID
    };

    // Initialize API client with credentials
    // Convert credentials to match VisaContext type
    const visaContext: VisaContext = {
      merchantId: this.credentials.merchantId || '',
      apiKeyId: this.credentials.merchantKeyId || '',
      secretKey: this.credentials.secretKey || '',
      environment: environment || 'SANDBOX',
      mode: 'agent-toolkit'
    };
    this.api = new VisaAcceptanceAPI(visaContext);
    this.tools = {};
    // Set configuration with defaults
    this.configuration = configuration;
    
    const allTools = tools(visaContext);

    const filteredTools = allTools.filter((tool: any) => {
      const allowed = isToolAllowed(tool, configuration);
      return allowed;
    });
    
    filteredTools.forEach((tool: any) => {
      this.tools[tool.method] = VisaAcceptanceTool(this.api, tool.method, tool.description, tool.parameters);
    });
  }

  /**
   * Get all available tools
   * @returns Array of CoreTool objects
   */
  getTools(): {[key: string]: Tool} {
    return this.tools;
  }
}
export default VisaAcceptanceAgentToolkit;
/* END GENAI */