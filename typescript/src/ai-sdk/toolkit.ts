import type { Tool } from 'ai';
import VisaAcceptanceAPI from '../shared/api';
import { VisaContext } from '../shared/types';
import VisaAcceptanceTool from './tool';
import { z } from 'zod';
import {isToolAllowed} from '../shared/configuration';
import {Configuration} from '../shared/types';
import tools from '../shared/tools';

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
   * @param options Configuration options matching Stripe's pattern
   */
  constructor( merchantIdTool: string | undefined, merchantKeyIdTool : string | undefined, secretKeyTool: string | undefined, configuration: Configuration = {}) {
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
      environment: 'SANDBOX'
    };
    this.api = new VisaAcceptanceAPI(visaContext);
    this.tools = {};
    // Set configuration with defaults
    this.configuration = configuration;
    
    // Log all available tools before filtering
    const allTools = tools(visaContext);

    // Log each tool filtering decision
    const filteredTools = allTools.filter((tool) => {
      const allowed = isToolAllowed(tool, configuration);
      return allowed;
    });
    
    filteredTools.forEach((tool) => {
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