//! Updated test-update-payment-link.js to use our new updatePaymentLink function from index.js

'use strict';

const { updatePaymentLink } = require('./index.js');

(async () => {
  // We'll update link PHAYDEN1 to INACTIVE
  const linkId = 'PHAYDEN1';
  const linkType = 'PURCHASE';
  const currency = 'USD';
  const totalAmount = '75';
  const lineItems = [
    {
      productName: 'Birthday Cake',
      quantity: '1',
      unitPrice: '75',
      totalAmount: '75'
    }
  ];
  const status = 'INACTIVE';

  console.log('Setting link ID:', linkId, 'to INACTIVE');
  const payload = {
    linkId,
    linkType,
    currency,
    totalAmount,
    lineItems,
    status
  };
  console.log('Using payload:', payload);

  try {
    const result = await updatePaymentLink(payload);
    console.log('Successfully updated payment link to INACTIVE. Response:', result);
  } catch (err) {
    console.error('Unexpected error calling updatePaymentLink:', err);
  }
})();
