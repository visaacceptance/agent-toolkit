

// Load environment variables first, before any access to process.env
require('dotenv').config();
import { VisaAcceptanceAgentToolkit } from '@visaacceptance/agent-toolkit/ai-sdk';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';



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
  "SANDBOX",
  configuration
);


async function aiGeneratedPaymentLink() {
  console.log("Attempting to generate a payment link...");
  const userPrompt = `Create a payment link for a Ski trip to Whistler Canada with a compelling selling point in the description. The total amount is $1000.00.`;
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
