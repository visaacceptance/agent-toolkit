import type { Tool } from 'ai';
import VisaAcceptanceAPI from '../shared/api';
import { VisaContext } from '../shared/types';
import VisaAcceptanceTool from './tool';
import { z } from 'zod';
import createInvoiceToolModule from '../shared/invoices/createInvoice';
import {isToolAllowed} from '../shared/configuration';
import {Configuration} from '../shared/types';


class VisaAcceptanceAgentToolkit {
  private api: VisaAcceptanceAPI;
  private tools: {[key: string]: Tool};
  private toolMap: Map<string, Tool> = new Map();
  private configuration: Configuration;
  private credentials: {
    secretKey?: string;
    merchantId?: string;
    merchantKeyId?: string;
  };

  /**
   * Creates a new Visa Acceptance Agent Toolkit
   * @param options Configuration options matching Stripe's pattern
   */
  constructor( secretKeyTool: string | undefined, merchantIdTool: string | undefined, merchantKeyIdTool : string | undefined, configuration: Configuration = {}) {
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
    this.configuration = configuration || {
      actions: {
        invoices: {
          create: true
        }
      }
    };
    
    // Initialize tools based on configuration
    this.initializeTools(visaContext);
  }

  /**
   * Initialize all available Visa Acceptance tools based on configuration
   */
  private initializeTools(visaContext: VisaContext): void {
    // Add create invoice tool if enabled in configuration
    if (this.configuration.actions?.invoices?.create !== false) {
      const createInvoiceTool = createInvoiceToolModule(visaContext);
    }

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