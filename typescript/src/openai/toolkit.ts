import type { CoreTool } from 'ai';
import CybersourceAPI from '../shared/api';
import { VisaContext } from '../shared/types';
import { z } from 'zod';
import type {
  ChatCompletionTool,
  ChatCompletionMessageToolCall,
  ChatCompletionToolMessageParam,
} from 'openai/resources';

/**
 * Configuration interface for Cybersource Agent Toolkit
 * Mirrors Stripe's toolkit configuration pattern
 */
export interface CybersourceAgentToolkitConfiguration {
  actions?: {
    paymentLinks?: {
      create?: boolean;
      read?: boolean;
      update?: boolean;
    };
    refunds?: {
      create?: boolean;
    };
    products?: {
      create?: boolean;
      read?: boolean;
    };
    prices?: {
      create?: boolean;
      read?: boolean;
    };
    checkout?: {
      create?: boolean;
    };
    invoices?: {
      create?: boolean;
      read?: boolean;
    };
  };
}

/**
 * Options for initializing the Cybersource Agent Toolkit
 */
export interface CybersourceAgentToolkitOptions {
  secretKey?: string;
  merchantId?: string;
  merchantKeyId?: string;
  configuration?: CybersourceAgentToolkitConfiguration;
}

class CybersourceAgentToolkit {
  private cybersourceApi: CybersourceAPI;
  private tools: ChatCompletionTool[] = [];
  private toolMap: Map<string, ChatCompletionTool> = new Map();
  private configuration: CybersourceAgentToolkitConfiguration;
  private credentials: {
    secretKey?: string;
    merchantId?: string;
    merchantKeyId?: string;
  };

  /**
   * Creates a new Cybersource Agent Toolkit
   * @param options Configuration options matching Stripe's pattern
   */
  constructor(options: CybersourceAgentToolkitOptions = {}) {
    this.credentials = {
      secretKey: options.secretKey || process.env.VISA_ACCEPTANCE_SECRET_KEY,
      merchantId: options.merchantId || process.env.VISA_ACCEPTANCE_MERCHANT_ID,
      merchantKeyId: options.merchantKeyId || process.env.VISA_ACCEPTANCE_API_KEY_ID
    };

    // Initialize API client with credentials
    // Convert credentials to match VisaContext type
    const visaContext: VisaContext = {
      merchantId: this.credentials.merchantId || '',
      apiKeyId: this.credentials.merchantKeyId || '',
      secretKey: this.credentials.secretKey || '',
      environment: 'SANDBOX'
    };
    this.cybersourceApi = new CybersourceAPI(visaContext);
    
    // Set configuration with defaults
    this.configuration = options.configuration || {
      actions: {
        paymentLinks: {
          create: true
        }
      }
    };
    
  }


  /**
   * Get all available tools
   * @returns Array of CoreTool objects
   */
  getTools(): ChatCompletionTool[] {
    return this.tools;
  }

  /**
   * Get a specific tool by name
   * @param name The name of the tool to retrieve
   * @returns The tool with the specified name, or undefined if not found
   */
  getTool(name: string): ChatCompletionTool | undefined {
    return this.toolMap.get(name);
  }

  /**
   * Handle a tool call from OpenAI
   * @param toolCall The tool call from OpenAI
   * @returns A tool response message compatible with OpenAI's format
   */
  async handleToolCall(toolCall: ChatCompletionMessageToolCall) {
    const args = JSON.parse(toolCall.function.arguments);
    const response = await (this.cybersourceApi as any).run(toolCall.function.name, args);
    return {
      role: 'tool',
      tool_call_id: toolCall.id,
      content: response,
    } as ChatCompletionToolMessageParam;
  }
}

export default CybersourceAgentToolkit;