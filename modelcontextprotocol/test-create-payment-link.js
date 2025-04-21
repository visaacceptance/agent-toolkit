// This script demonstrates how to call createPaymentLink in index.js directly,
// passing in an object with linkType, purchaseNumber, currency, totalAmount, and lineItems.

const { createPaymentLink } = require('./index.js');

(async () => {
  // Example data for creating a pay-by-link
  const data = {
    linkType: 'PURCHASE',
    purchaseNumber: Math.random().toString(36).substring(2, 17),
    currency: 'USD',
    totalAmount: '50',
    lineItems: [
      {
        productName: 'cake',
        unitPrice: '50',
        quantity: '1'
      }
    ]
  };

  console.log('Creating Payment Link with data:', data);

  try {
    // Call createPaymentLink from index.js
    const result = await createPaymentLink(data);
    console.log('Successfully created payment link. Response:', result);
  } catch (err) {
    console.error('Error creating payment link:', err);
  }
})();
