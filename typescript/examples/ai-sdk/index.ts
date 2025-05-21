// Revised index.ts to address the new TypeScript errors:
// 1) "Module '\"openai/resources\"' has no exported member 'ToolSet'" – We'll remove usage of ToolSet and create our own type.
// 2) "'name' does not exist on type 'ChatCompletionTool'" – The openai/resources ChatCompletionTool type doesn't support 'name' as a property.
// 3) We'll define each tool as a property in a simple object, keyed by the tool's name, with the shape ChatCompletionTool expects (description, parameters).

// Load environment variables first, before any access to process.env
require('dotenv').config();
import { green, yellow, red } from 'colors';
import { VisaAcceptanceAgentToolkit } from '../../src/ai-sdk';
import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';

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
  compatibility: 'strict',
  baseURL: 'https://model-service-preview.genai.visa.com/v1',
  apiKey: process.env.OPENAI_API_KEY
});

const configuration = {
  actions: {
    paymentLinks: {
      create: true
    }
  },
};

const visaAcceptanceAgentToolkit = new VisaAcceptanceAgentToolkit(
  process.env.VISA_ACCEPTANCE_MERCHANT_ID,
  process.env.VISA_ACCEPTANCE_API_KEY_ID,
  process.env.VISA_ACCEPTANCE_SECRET_KEY,
  configuration
);


async function aiGeneratedPaymentLink() {
  console.log("Attempting to generate a payment link...");
  const userPrompt = `Create a payment link for a Ski Trip to Whistler, Canada. The total amount is $1000.00. The payment link should be valid for 30 days.`;
  const result = await generateText({
    model: openai('gpt-4o'),
    tools: {
      ...visaAcceptanceAgentToolkit.getTools(),
    },
    maxSteps: 5,
    prompt: userPrompt,
  });
  console.log(result);
}

aiGeneratedPaymentLink();