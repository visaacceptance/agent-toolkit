import { CybersourceAgentToolkit } from '../../../../src/ai-sdk';
//import { openai } from '@ai-sdk/openai';
import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const openai = createOpenAI({
    // custom settings, e.g.
    compatibility: 'strict',
    baseURL: 'https://model-service-preview.genai.visa.com/v1'
  });
  

  try {
    // Extract course info from request body
    const { courseName, price } = req.body;
    
    // Generate a unique purchase number
    const purchaseNumber = 'AGC' + Date.now().toString().slice(-8);
    
    // Create a toolkit configuration
    const configuration = {
      actions: {
        paymentLinks: {
          create: true,
        }
      },
    };
    
    // Initialize CybersourceAgentToolkit with credentials and configuration
    const cybersourceAgentToolkit = new CybersourceAgentToolkit(
      process.env.CYBERSOURCE_SECRET_KEY,
      process.env.CYBERSOURCE_MERCHANT_ID,
      process.env.CYBERSOURCE_API_KEY_ID,
      configuration
    );
    
    // Define the user prompt with course details
    // (Placeholder text was missing; let's keep it in-line)
    const userPrompt = `Create a payment link for a course called Mastering Agentic Commerce with a price of $${price}. 
                        Use purchase number ${purchaseNumber} and currency USD.`;
    
    // Generate text using the toolkit
    const result = await generateText({
      model: openai('gpt-4o'),
      tools: {
        ...cybersourceAgentToolkit.getTools(),
      },
      maxSteps: 5,
      prompt: userPrompt,
    });
    
    // The result is already the response from the tool, so let's log it to see its structure
    console.log('Result from generateText:', JSON.stringify(result, null, 2));
    
    // Extract the payment URL directly from the tool call results in result.toolCalls
    let paymentUrl = null;
    
    // Check if we have tool calls in the result
    if (result && result.toolCalls && result.toolCalls.length > 0) {
      // Look for create_payment_link tool call results
      for (const toolCall of result.toolCalls) {
        if (toolCall.name === 'create_payment_link' && toolCall.result) {
          const toolResult = toolCall.result;
          if (toolResult._links && toolResult._links.payment && toolResult._links.payment.href) {
            paymentUrl = toolCalls[0].result._links.payment.href;
      }
    }
      }}
    
    // If no toolCalls found, try to extract URL from the text content
    if (!paymentUrl && typeof result.text === 'string') {
      const urlMatch = result.text.match(/https?:\/\/[^\s]+/);
      if (urlMatch) {
        // Remove trailing ")" or similar punctuation from the matched URL
        paymentUrl = urlMatch[0].replace(/[)]+$/, '');
      }
    }
    
    // Return the payment URL to the client
    if (paymentUrl) {
      return res.status(200).json({
        success: true,
        paymentUrl: paymentUrl,
        purchaseNumber
      });
    } else {
      throw new Error('Payment URL not found in response');
    }
  } catch (error) {
    console.error('Error creating payment link:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to create payment link'
    });
  }
}
