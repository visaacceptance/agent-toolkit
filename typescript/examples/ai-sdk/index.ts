// Revised index.ts to address the new TypeScript errors:
// 1) "Module '\"openai/resources\"' has no exported member 'ToolSet'" – We'll remove usage of ToolSet and create our own type.
// 2) "'name' does not exist on type 'ChatCompletionTool'" – The openai/resources ChatCompletionTool type doesn't support 'name' as a property.
// 3) We'll define each tool as a property in a simple object, keyed by the tool's name, with the shape ChatCompletionTool expects (description, parameters).

import { VisaAcceptanceAgentToolkit } from '../../src/ai-sdk';
import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';

// The openai/resources package's types for ChatCompletionTool don't include "name" or "strict". We'll define our tool shape following that type:
export interface ChatCompletionTool {
  description: string;
  parameters: {
    type: string;
    properties: Record<string, { type: string; description: string }>;
    required: string[];
    additionalProperties?: boolean;
  };
}
const openai = createOpenAI({
  // custom settings, e.g.
  compatibility: 'strict',
  baseURL: 'https://model-service-preview.genai.visa.com/v1'
});

// Load environment variables from .env
require('dotenv').config();
process.env.REQUESTS_CA_BUNDLE = 'c:/Users/jbrans/repos/test/cacerts.pem';
process.env.no_proxy = '.visa.com';
// Manually set the base URL for the custom OpenAI endpoint (similar to main.py)


// Sample config
const configuration = {
  actions: {
    invoices: {
      create: true,
    }
  },
};

if (!process.env.VISA_ACCEPTANCE_SECRET_KEY || !process.env.VISA_ACCEPTANCE_MERCHANT_ID || !process.env.VISA_ACCEPTANCE_API_KEY_ID) {
  console.error('Missing required environment variables. Please check your .env file.');
  process.exit(1);
}

// Initialize the Visa Acceptance agent
const visaAcceptanceAgentToolkit = new VisaAcceptanceAgentToolkit(
  process.env.VISA_ACCEPTANCE_SECRET_KEY,
  process.env.VISA_ACCEPTANCE_MERCHANT_ID,
  process.env.VISA_ACCEPTANCE_API_KEY_ID,
  configuration
);



async function aiGeneratedInvoice() {

  const userPrompt = `Create an invoice for Ski Resort Package priced at $499.99`;

  try {
    const result = await generateText({
      model: openai('gpt-4o'),
      
      tools: {
        ...visaAcceptanceAgentToolkit.getTools(),
      },
      maxSteps: 5,
      prompt: userPrompt,
    });

  } catch (error) {
    console.error('Error generating text:', error);
  }
}

aiGeneratedInvoice();