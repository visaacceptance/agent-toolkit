import { CybersourceAgentToolkit } from '../src/ai-sdk';

// Define the minimal options required by ToolExecutionOptions
interface ToolExecutionOptions {
  toolCallId: string;
  messages: any[];
}

async function main() {
  try {
    // Create an instance of the toolkit
    const toolkit = new CybersourceAgentToolkit();
    
    // Get the payment link creation tool
    const tools = toolkit.getTools();
    console.log(`Available tools: ${tools.length}`);
    
    // Get the specific tool
    const paymentLinkTool = toolkit.getTools()['create_payment_link'];
    if (!paymentLinkTool) {
      console.error('Payment link tool not found');
      return;
    }
    
    console.log('Payment link tool found, attempting to create payment link...');
    
    // Create payment link - handle the execute function with its required options
    if (paymentLinkTool.execute) {
      const result = await paymentLinkTool.execute(
        {
          linkType: 'PURCHASE',
          purchaseNumber: Math.random().toString(36).substring(7),
          currency: 'USD',
          totalAmount: '42.00',
          lineItems: [
            {
              productName: 'Test Product',
              productSKU: 'TEST-SKU-123',
              description: 'Test product for API',
              quantity: '1',
              unitPrice: '42.00',
              totalAmount: '42.00'
            }
          ]
        },
        {
          toolCallId: 'paylink-' + Date.now(),
          messages: []
        } // Provide required parameters for ToolExecutionOptions
      );
      
      console.log('Payment link created successfully:');
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.error('Execute method not available on payment link tool');
    }
  } catch (error) {
    console.error('Error creating payment link:', error);
  }
}

main();