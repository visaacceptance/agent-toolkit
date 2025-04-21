import type { Tool } from 'ai';
import CybersourceAPI from '../shared/api';
import CybersourceTool from './tool';
import { z } from 'zod';
import { createPaymentLinkSchema } from '../shared/parameters';
import {isToolAllowed, type Configuration} from '../shared/configuration';


class CybersourceAgentToolkit {
  private api: CybersourceAPI;
  private tools: {[key: string]: Tool};
  private toolMap: Map<string, Tool> = new Map();
  private configuration: Configuration;
  private credentials: {
    secretKey?: string;
    merchantId?: string;
    merchantKeyId?: string;
  };

  /**
   * Creates a new Cybersource Agent Toolkit
   * @param options Configuration options matching Stripe's pattern
   */
  constructor( secretKeyTool: string | undefined, merchantIdTool: string | undefined, merchantKeyIdTool : string | undefined, configuration: Configuration = {}) {
    this.credentials = {
      secretKey: secretKeyTool || process.env.CYBERSOURCE_SECRET_KEY,
      merchantId: merchantIdTool || process.env.CYBERSOURCE_MERCHANT_ID,
      merchantKeyId: merchantKeyIdTool || process.env.CYBERSOURCE_API_KEY_ID
    };

    // Initialize API client with credentials
    this.api = new CybersourceAPI(this.credentials);
    this.tools = {};
    // Set configuration with defaults
    this.configuration = configuration || {
      actions: {
        paymentLinks: {
          create: true
        }
      }
    };
    
    // Initialize tools based on configuration
    this.initializeTools();
  }

  /**
   * Initialize all available Cybersource tools based on configuration
   */
  private initializeTools(): void {
    // Add create payment link tool if enabled in configuration
    if (this.configuration.actions?.paymentLinks?.create !== false) {
      const createPaymentLinkTool = CybersourceTool(
        this.api,
        'create_payment_link',
        'Create a payment link using Cybersource PayByLink API',
        createPaymentLinkSchema
      );
      
      this.tools['create_payment_link'] = (createPaymentLinkTool);
      this.toolMap.set('create_payment_link', createPaymentLinkTool);
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
export default CybersourceAgentToolkit;