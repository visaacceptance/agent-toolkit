/* © 2025 Visa.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import { createInvoice } from '../../../../shared/invoices/createInvoice';
import { getInvoice } from '../../../../shared/invoices/getInvoice';
import { listInvoices } from '../../../../shared/invoices/listInvoices';
import { updateInvoice } from '../../../../shared/invoices/updateInvoice';
import { cancelInvoice } from '../../../../shared/invoices/cancelInvoice';
import { sendInvoice } from '../../../../shared/invoices/sendInvoice';
import { acquireLock, generateObjectId, releaseLock } from '../../helper';
import { getVisaAcceptanceClientAndContext } from '../../configuration';

const {
  client: visaClient,
  context: visaContext,
} = getVisaAcceptanceClientAndContext();

describe('Invoice integration flow', () => {
  beforeEach(async () => {
    await acquireLock('invoices');
  });

  afterEach(async () => {
    await releaseLock('invoices');
  });

  it('should create an invoice and get it', async () => {
    const invoiceId = generateObjectId();

    // Create
    const paramsCreate = {
      invoice_number: invoiceId,
      totalAmount: '100.00',
      currency: 'USD',
      invoiceInformation: {
        description: 'Test',
        dueDate: '2020-01-01',
        sendImmediately: true,
        deliveryMode: 'None',
      },
    }
    const expectedCreate = {
      invoiceInformation: {
        allowPartialPayments: false,
        deliveryMode: 'None',
        description: 'Test',
        dueDate: '2020-01-01T00:00:00.000Z',
        invoiceNumber: invoiceId,
      },
      orderInformation: {
        amountDetails: {
          balanceAmount: '100',
          currency: 'USD',
          totalAmount: '100',
        },
      },
      processingInformation: {
        requestPhone: false,
        requestShipping: false,
      },
      status: 'CREATED',
    }

    const resultCreate = await createInvoice(visaClient, visaContext, paramsCreate);

    expect(resultCreate).toMatchObject(expectedCreate)
    
    // Get
    const paramsGet = { id: invoiceId };

    const resultGet = await getInvoice(visaClient, visaContext, paramsGet);

    expect(resultGet).toMatchObject(expectedCreate);
  });

  
  it('should create an invoice and update it', async () => {
    const invoiceId = generateObjectId();

    // Create
    const paramsCreate = {
      invoice_number: invoiceId,
      totalAmount: '100.00',
      currency: 'USD',
      invoiceInformation: {
        description: 'Test',
        dueDate: '2020-01-01',
        sendImmediately: true,
        deliveryMode: 'None',
      },
    }

    await createInvoice(visaClient, visaContext, paramsCreate);
    
    // Update
    const paramsUpdate = {
      id: invoiceId,
      customerInformation: {},
      invoiceInformation: {
        description: 'Updated Test',
        dueDate: '2020-02-01',
      },
      orderInformation: {
        amountDetails: {
          totalAmount: '150.00',
          currency: 'USD'
        }
      }
    };

    const expectedUpdate = {
      invoiceInformation: {
        description: 'Updated Test',
        dueDate: '2020-02-01T00:00:00.000Z',
        invoiceNumber: invoiceId,
      },
      orderInformation: {
        amountDetails: {
          currency: 'USD',
          totalAmount: '150',
        },
      },
      status: 'CREATED',
    };

    const resultUpdate = await updateInvoice(visaClient, visaContext, paramsUpdate);

    expect(resultUpdate).toMatchObject(expectedUpdate);
  });

  it('should create two invoices and list them', async () => {
    // Create 1
    const invoiceId1 = generateObjectId();
    const paramsCreate1 = {
      invoice_number: invoiceId1,
      totalAmount: '100.00',
      currency: 'USD',
      invoiceInformation: {
        description: 'Test Invoice 1',
        dueDate: '2020-01-01',
        sendImmediately: true,
        deliveryMode: 'None',
      },
    };
    await createInvoice(visaClient, visaContext, paramsCreate1);

    // Create 2
    const invoiceId2 = generateObjectId();
    const paramsCreate2 = {
      invoice_number: invoiceId2,
      totalAmount: '200.00',
      currency: 'USD',
      invoiceInformation: {
        description: 'Test Invoice 2',
        dueDate: '2020-01-15',
        sendImmediately: true,
        deliveryMode: 'None',
      },
    };
    await createInvoice(visaClient, visaContext, paramsCreate2);

    // List
    const paramsList = {
      offset: 0,
      limit: 10,
    };
    
    const resultList = await listInvoices(visaClient, visaContext, paramsList) as any;
    
    // Extract invoice numbers from the response
    const invoiceNumbers = resultList.invoices.map((invoice: any) => 
      invoice.id
    );
    
    // Check if both our invoice IDs are in the list
    expect(invoiceNumbers).toContain(invoiceId1);
    expect(invoiceNumbers).toContain(invoiceId2);
  });

  it('should create an invoice and cancel it', async () => {
    // Create
    const invoiceId = generateObjectId();
    const paramsCreate = {
      invoice_number: invoiceId,
      totalAmount: '100.00',
      currency: 'USD',
      invoiceInformation: {
        description: 'Test Invoice to Cancel',
        dueDate: '2020-01-01',
        sendImmediately: true,
        deliveryMode: 'None',
      },
    };
    await createInvoice(visaClient, visaContext, paramsCreate);

    // Cancel
    const paramsCancel = {
      invoice_id: invoiceId
    };
    
    const resultCancel = await cancelInvoice(visaClient, visaContext, paramsCancel);
    
    // Check if the invoice was successfully canceled
    expect(resultCancel.data.status).toEqual('CANCELED');
  });
  
  it('should create an invoice and send it', async () => {
    // Create
    const invoiceId = generateObjectId();
    const paramsCreate = {
      invoice_number: invoiceId,
      totalAmount: '100.00',
      currency: 'USD',
      invoiceInformation: {
        description: 'Test Invoice to Send',
        dueDate: '2020-01-01',
        sendImmediately: false,
        deliveryMode: 'None',
      },
    };
    await createInvoice(visaClient, visaContext, paramsCreate);

    // Send
    const paramsSend = {
      invoice_id: invoiceId
    };
    
    const resultSend = await sendInvoice(visaClient, visaContext, paramsSend);
    
    // Check if the invoice was successfully sent
    expect(resultSend.status).toBe(200);
  });
});
