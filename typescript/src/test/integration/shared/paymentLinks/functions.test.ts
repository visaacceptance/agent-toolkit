/* © 2025 Visa.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import { createPaymentLink } from '../../../../shared/paymentLinks/createPaymentLink';
import { getPaymentLink } from '../../../../shared/paymentLinks/getPaymentLink';
import { listPaymentLinks } from '../../../../shared/paymentLinks/listPaymentLinks';
import { updatePaymentLink } from '../../../../shared/paymentLinks/updatePaymentLink';
import { acquireLock, generateObjectId, releaseLock } from '../../helper';
import { getVisaAcceptanceClientAndContext } from '../../configuration';

const {
  client: visaClient,
  context: visaContext,
} = getVisaAcceptanceClientAndContext();

describe('Payment links integration flow', () => {
  beforeEach(async () => {
    await acquireLock('paymentLinks');
  });

  afterEach(async () => {
    await releaseLock('paymentLinks');
  });

  it('should create a payment link and get it', async () => {
    // Create
    const paymentLinkId = generateObjectId();
    const paramsCreate = {
      linkType: 'PURCHASE',
      purchaseNumber: paymentLinkId,
      currency: 'USD',
      totalAmount: '100.00',
      requestPhone: false,
      requestShipping: false,
      lineItems: [
        {
          productName: 'Test Product',
          productSKU: 'SKU123',
          productDescription: 'Test product description',
          quantity: '1',
          unitPrice: '100.00'
        }
      ]
    };

    const expectedCreate = {
      id: paymentLinkId,
      status: 'ACTIVE',
      processingInformation: {
        linkType: 'PURCHASE',
        requestPhone: false,
        requestShipping: false
      },
      purchaseInformation: {
        purchaseNumber: paymentLinkId,
      },
      orderInformation: {
        amountDetails: {
          totalAmount: '100',
          currency: 'USD',
        },
      }
    };

    const resultCreate = await createPaymentLink(visaClient, visaContext, paramsCreate);
    
    expect(resultCreate).toMatchObject(expectedCreate);


    // Get
    const paramsGet = { id: paymentLinkId };
    const resultGet = await getPaymentLink(visaClient, visaContext, paramsGet);
    
    expect(resultGet).toMatchObject(expectedCreate);
  });


  it('should create two payment links and list them', async () => {    
    // Create 1
    const paymentLinkId1 = generateObjectId();
    const paramsCreate1 = {
      linkType: 'PURCHASE',
      purchaseNumber: paymentLinkId1,
      currency: 'USD',
      totalAmount: '100.00',
      requestPhone: false,
      requestShipping: false,
      lineItems: [
        {
          productName: 'Test Product 1',
          productSKU: 'SKU123',
          productDescription: 'Test product description 1',
          quantity: '1',
          unitPrice: '100.00'
        }
      ]
    };
    
    await createPaymentLink(visaClient, visaContext, paramsCreate1);
    
    // Create 2
    const paymentLinkId2 = generateObjectId();
    const paramsCreate2 = {
      linkType: 'PURCHASE',
      purchaseNumber: paymentLinkId2,
      currency: 'USD',
      totalAmount: '200.00',
      requestPhone: false,
      requestShipping: false,
      lineItems: [
        {
          productName: 'Test Product 2',
          productSKU: 'SKU456',
          productDescription: 'Test product description 2',
          quantity: '2',
          unitPrice: '100.00'
        }
      ]
    };
    
    await createPaymentLink(visaClient, visaContext, paramsCreate2);
    
    // List
    const paramsList = {
      offset: 0,
      limit: 10
    };
    
    const resultList = await listPaymentLinks(visaClient, visaContext, paramsList) as any;
    
    // Extract payment link IDs from the response
    const paymentLinkIds = resultList.links.map((link: any) => link.id);
    
    // Check if both our payment link IDs are in the list
    expect(paymentLinkIds).toContain(paymentLinkId1);
    expect(paymentLinkIds).toContain(paymentLinkId2);
  });

  it('should create a payment link and update it', async () => {
    // Create
    const paymentLinkId = generateObjectId();
    const paramsCreate = {
      linkType: 'PURCHASE',
      purchaseNumber: paymentLinkId,
      currency: 'USD',
      totalAmount: '100.00',
      requestPhone: false,
      requestShipping: false,
      lineItems: [
        {
          productName: 'Test Product',
          productSKU: 'SKU123',
          productDescription: 'Test product description',
          quantity: '1',
          unitPrice: '100.00'
        }
      ]
    };
    
    await createPaymentLink(visaClient, visaContext, paramsCreate);
    
    // Update
    const paramsUpdate = {
      id: paymentLinkId,
      totalAmount: '150.00',
      currency: 'USD',
      lineItems: [
        {
          productName: 'Updated Test Product',
          productSKU: 'SKU123-UPDATED',
          productDescription: 'Updated test product description',
          quantity: '1',
          unitPrice: '150.00'
        }
      ],
    };

    const expectedUpdate = {
      id: paymentLinkId,
      status: 'ACTIVE',
      processingInformation: {
        linkType: 'PURCHASE',
        requestPhone: false,
        requestShipping: false
      },
      purchaseInformation: {
        purchaseNumber: paymentLinkId,
      },
      orderInformation: {
        amountDetails: {
          totalAmount: '150',
          currency: 'USD'
        },
      }
    } 

    const resultUpdate = await updatePaymentLink(visaClient, visaContext, paramsUpdate);

    expect(resultUpdate).toMatchObject(expectedUpdate);
  });

  it('should create a payment link and update it with only required fields', async () => {
    // Create
    const paymentLinkId = generateObjectId();
    const paramsCreate = {
      linkType: 'PURCHASE',
      purchaseNumber: paymentLinkId,
      currency: 'USD',
      totalAmount: '100.00',
      requestPhone: false,
      requestShipping: false,
      lineItems: [
        {
          productName: 'Test Product',
          productSKU: 'SKU123',
          productDescription: 'Test product description',
          quantity: '1',
          unitPrice: '100.00'
        }
      ]
    };
    
    await createPaymentLink(visaClient, visaContext, paramsCreate);
    
    // Update with only required fields
    const paramsMinimalUpdate = {
      id: paymentLinkId,
      currency: 'USD'
    };

    const expectedMinimalUpdate = {
      id: paymentLinkId,
      status: 'ACTIVE',
      processingInformation: {
        linkType: 'PURCHASE',
        requestPhone: false,
        requestShipping: false
      },
      purchaseInformation: {
        purchaseNumber: paymentLinkId,
      },
      orderInformation: {
        amountDetails: {
          currency: 'USD'
        },
      }
    } 

    const resultMinimalUpdate = await updatePaymentLink(visaClient, visaContext, paramsMinimalUpdate);

    expect(resultMinimalUpdate).toMatchObject(expectedMinimalUpdate);
  });
});
