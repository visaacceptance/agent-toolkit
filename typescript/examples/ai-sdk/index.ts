/* © 2025 Visa.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

// Load environment variables first, before any access to process.env
require('dotenv').config();
import { VisaAcceptanceAgentToolkit } from '@visaacceptance/agent-toolkit/ai-sdk';
import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';

const openai = createOpenAI({
  baseURL: process.env.OPENAI_BASE_URL,
  apiKey: process.env.OPENAI_API_KEY,
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
  'SANDBOX',
  configuration
);


async function aiGeneratedPaymentLink() {
  console.log("Attempting to generate a payment link...");
  const userPrompt = `Create a payment link for a Ski trip to Whistler, Canada with a compelling selling point in the description. The total amount is $1000.00.`;
  const result = await generateText({
    model: openai('gpt-4o'),
    tools: visaAcceptanceAgentToolkit.getTools() as any,
    prompt: userPrompt
  });
  console.log(JSON.stringify(result, null, 2));
}

aiGeneratedPaymentLink();