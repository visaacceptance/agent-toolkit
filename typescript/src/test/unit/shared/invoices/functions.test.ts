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
import { mockVisaContext } from '../helper';

jest.mock('cybersource-rest-client', () => ({
  InvoicesApi: jest.fn()
}));

describe('getInvoice', () => {
  let mockGetInvoice: jest.Mock;

  beforeEach(() => {
    mockGetInvoice = jest.fn();
    (require('cybersource-rest-client').InvoicesApi as jest.Mock).mockImplementation(() => ({
      getInvoice: mockGetInvoice
    }));
  });

  it('should return invoice details on successful API call', async () => {
    const mockApiResult = {
      id: 'INV_001',
      status: 'SENT',
      amount: '100.00',
      currency: 'USD',
    };
    mockGetInvoice.mockImplementation((id, callback) => {
      callback(null, mockApiResult);
    });

    const params = { id: 'INV_001' };
    const result = await getInvoice({}, mockVisaContext, params);

    expect(mockGetInvoice).toHaveBeenCalledTimes(1);
    expect(mockGetInvoice).toHaveBeenCalledWith('INV_001', expect.any(Function));
    expect(result).toEqual(mockApiResult);
  });

  it('should handle API errors gracefully', async () => {
    const apiErrorMessage = 'API Error: timeout limit exceeded';
    const mockApiResult = { response: { text: apiErrorMessage } };

    mockGetInvoice.mockImplementation((id, callback) => {
      callback(mockApiResult, null);
    });

    const params = { id: 'NON_EXISTENT_INV' };
    const result = await getInvoice({}, mockVisaContext, params);

    expect(mockGetInvoice).toHaveBeenCalledTimes(1);
    expect(mockGetInvoice).toHaveBeenCalledWith('NON_EXISTENT_INV', expect.any(Function));
    expect(result).toEqual('Failed to get invoice');
  });
});

describe('listInvoices', () => {
  let mockListInvoices: jest.Mock;

  beforeEach(() => {
    mockListInvoices = jest.fn();
    (require('cybersource-rest-client').InvoicesApi as jest.Mock).mockImplementation(() => ({
      getAllInvoices: mockListInvoices
    }));
  });

  it('should return a list of invoices with correct pagination', async () => {
    const mockApiResult = {
      invoices: [
        { id: 'INV_001', amount: '100.00' },
        { id: 'INV_002', amount: '200.00' }
      ],
      offset: 0,
      limit: 2,
      totalCount: 5
    };
    mockListInvoices.mockImplementation((offset, limit, status, callback) => {
      callback(null, mockApiResult);
    });

    const params = { offset: 0, limit: 2 };
    const result = await listInvoices({}, mockVisaContext, params);

    expect(mockListInvoices).toHaveBeenCalledTimes(1);
    expect(mockListInvoices).toHaveBeenCalledWith(0, 2, {}, expect.any(Function));
    expect(result).toEqual(mockApiResult);
  });

  it('should apply status filter when provided', async () => {
    const mockApiResult = {
      invoices: [
        { id: 'INV_003', amount: '300.00' }
      ],
      offset: 0,
      limit: 10,
      totalCount: 1
    };
    mockListInvoices.mockImplementation((offset, limit, status, callback) => {
      callback(null, mockApiResult);
    });

    const params = { offset: 0, limit: 10, status: 'PAID' };
    const result = await listInvoices({}, mockVisaContext, params);

    expect(mockListInvoices).toHaveBeenCalledTimes(1);
    expect(mockListInvoices).toHaveBeenCalledWith(0, 10, {status: 'PAID'}, expect.any(Function));
    expect(result).toEqual(mockApiResult);
  });

  it('should handle API errors gracefully', async () => {
    const apiErrorMessage = 'API Error: timeout limit exceeded';
    const mockApiResult = { response: { text: apiErrorMessage } };
    mockListInvoices.mockImplementation((offset, limit, status, callback) => {
      callback(mockApiResult, null);
    });

    const params = { offset: 0, limit: 10 };
    const result = await listInvoices({}, mockVisaContext, params);

    expect(mockListInvoices).toHaveBeenCalledTimes(1);
    expect(mockListInvoices).toHaveBeenCalledWith(0, 10, {}, expect.any(Function));
    expect(result).toEqual('Failed to list invoices');
  });
});

describe('updateInvoice', () => {
  let mockUpdateInvoice: jest.Mock;

  beforeEach(() => {
    mockUpdateInvoice = jest.fn();
    (require('cybersource-rest-client').InvoicesApi as jest.Mock).mockImplementation(() => ({
      updateInvoice: mockUpdateInvoice
    }));
  });

  it('should successfully update an invoice with provided details', async () => {
    const mockApiResult = {
      id: 'INV_001',
      status: 'UPDATED',
      amount: '150.00',
      currency: 'USD'
    };
    mockUpdateInvoice.mockImplementation((id, requestObj, callback) => {
      callback(null, mockApiResult);
    });

    const params = {
      id: 'INV_001',
      customerInformation: {},
      orderInformation: {
        amountDetails: { totalAmount: '150.00', currency: 'USD' }
      },
      invoiceInformation: {
        dueDate: "",
        description: "",
      }
    };
    const result = await updateInvoice({}, mockVisaContext, params);

    expect(mockUpdateInvoice).toHaveBeenCalledTimes(1);
    expect(mockUpdateInvoice).toHaveBeenCalledWith(
      'INV_001',
      expect.objectContaining({
        customerInformation: {},
        orderInformation: {
          amountDetails: {
            totalAmount: '150.00',
            currency: 'USD'
          }
        },
        invoiceInformation: {
          dueDate: "",
          description: '',
        }
      }),
      expect.any(Function)
    );
    expect(result).toEqual(mockApiResult);
  });

  it('should handle API errors gracefully', async () => {
    const apiErrorMessage = 'API Error: timeout limit exceeded';
    const mockApiResult = { response: { text: apiErrorMessage } };
    mockUpdateInvoice.mockImplementation((id, requestObj, callback) => {
      callback(mockApiResult, null);
    });

    const params = {
      id: 'INV_001',
      customerInformation: {},
      orderInformation: {
        amountDetails: { totalAmount: '150.00', currency: 'USD' }
      },
      invoiceInformation: {
        dueDate: "",
        description: "",
      }
    };
    const result = await updateInvoice({}, mockVisaContext, params);

    expect(mockUpdateInvoice).toHaveBeenCalledTimes(1);
    expect(mockUpdateInvoice).toHaveBeenCalledWith(
      'INV_001',
      expect.objectContaining({
        customerInformation: {},
        orderInformation: {
          amountDetails: {
            totalAmount: '150.00',
            currency: 'USD'
          }
        },
        invoiceInformation: {
          dueDate: "",
          description: '',
        }
      }),
      expect.any(Function)
    );
    expect(result).toEqual('Failed to update invoice');
  });
});

describe('createInvoice', () => {
  let mockCreateInvoice: jest.Mock;

  beforeEach(() => {
    mockCreateInvoice = jest.fn();
    (require('cybersource-rest-client').InvoicesApi as jest.Mock).mockImplementation(() => ({
      createInvoice: mockCreateInvoice
    }));
  });

  it('should handle API errors gracefully', async () => {
    const apiErrorMessage = 'API Error: timeout limit exceeded';
    const mockApiResult = { response: { text: apiErrorMessage } };
    mockCreateInvoice.mockImplementation((requestObj, callback) => {
      callback(mockApiResult, null);
    });

    const params = {
      invoice_number: 'INV_0000',
      totalAmount: '10.00',
      currency: 'USD',
      invoiceInformation: {
        description: "",
        dueDate: "",
        deliveryMode: "",
        sendImmediately: false,
      }
    };

    const result = await createInvoice({}, mockVisaContext, params);

    expect(mockCreateInvoice).toHaveBeenCalledTimes(1);
    expect(mockCreateInvoice).toHaveBeenCalledWith(
      expect.objectContaining({
        invoiceInformation: expect.objectContaining({
          invoiceNumber: params.invoice_number
        }),
        orderInformation: expect.objectContaining({
          amountDetails: expect.objectContaining({ 
            totalAmount: params.totalAmount,
            currency: params.currency
          })
        })
      }),
      expect.any(Function)
    );
    expect(result).toEqual('Failed to create invoice');
  });

  it('should return response object on success', async () => {
    const mockApiResult = { status: 'SUCCESS' };
    mockCreateInvoice.mockImplementation((requestObj, callback) => {
      callback(null, mockApiResult);
    });

    const params = {
      invoice_number: 'INV_0000',
      totalAmount: '10.00',
      currency: 'USD',
      invoiceInformation: {
        description: "",
        dueDate: "",
        deliveryMode: "",
        sendImmediately: false,
      }
    };

    const result = await createInvoice({}, mockVisaContext, params);

    expect(mockCreateInvoice).toHaveBeenCalledTimes(1);
    expect(mockCreateInvoice).toHaveBeenCalledWith(
      expect.objectContaining({
        invoiceInformation: expect.objectContaining({
          invoiceNumber: params.invoice_number
        }),
        orderInformation: expect.objectContaining({
          amountDetails: expect.objectContaining({ 
            totalAmount: params.totalAmount,
            currency: params.currency
          })
        })
      }),
      expect.any(Function)
    );
    expect(result).toEqual(mockApiResult);
  });
});

describe('cancelInvoice', () => {
  let mockCancelInvoice: jest.Mock;

  beforeEach(() => {
    mockCancelInvoice = jest.fn();
    (require('cybersource-rest-client').InvoicesApi as jest.Mock).mockImplementation(() => ({
      performCancelAction: mockCancelInvoice
    }));
  });

  it('should successfully cancel an invoice', async () => {
    const mockApiResult = {
      status: 'CANCELLED',
      data: { id: 'INV_001' }
    };
    mockCancelInvoice.mockImplementation((id, callback) => {
      callback(null, mockApiResult.data, { status: mockApiResult.status });
    });

    const params = { invoice_id: 'INV_001' };
    const result = await cancelInvoice({}, mockVisaContext, params);

    expect(mockCancelInvoice).toHaveBeenCalledTimes(1);
    expect(mockCancelInvoice).toHaveBeenCalledWith('INV_001', expect.any(Function));
    expect(result).toEqual({
      data: mockApiResult.data,
      status: mockApiResult.status
    });
  });

  it('should handle API errors gracefully', async () => {
    const apiErrorMessage = 'API Error: Unable to cancel invoice';
    mockCancelInvoice.mockImplementation((id, callback) => {
      callback({ message: apiErrorMessage }, null);
    });

    const params = { invoice_id: 'INV_001' };
    const result = await cancelInvoice({}, mockVisaContext, params);

    expect(mockCancelInvoice).toHaveBeenCalledTimes(1);
    expect(mockCancelInvoice).toHaveBeenCalledWith('INV_001', expect.any(Function));
    expect(result).toEqual('Failed to cancel invoice');
  });
});

describe('sendInvoice', () => {
  let mockSendInvoice: jest.Mock;

  beforeEach(() => {
    mockSendInvoice = jest.fn();
    (require('cybersource-rest-client').InvoicesApi as jest.Mock).mockImplementation(() => ({
      performSendAction: mockSendInvoice
    }));
  });

  it('should successfully send an invoice', async () => {
    const mockApiResult = {
      status: 'SENT',
      data: { id: 'INV_001' }
    };
    mockSendInvoice.mockImplementation((id, callback) => {
      callback(null, mockApiResult.data, { status: mockApiResult.status });
    });

    const params = { invoice_id: 'INV_001' };
    const result = await sendInvoice({}, mockVisaContext, params);

    expect(mockSendInvoice).toHaveBeenCalledTimes(1);
    expect(mockSendInvoice).toHaveBeenCalledWith('INV_001', expect.any(Function));
    expect(result).toEqual({
      data: mockApiResult.data,
      status: mockApiResult.status
    });
  });

  it('should handle API errors gracefully', async () => {
    const apiErrorMessage = 'API Error: Unable to send invoice';
    mockSendInvoice.mockImplementation((id, callback) => {
      callback({ message: apiErrorMessage }, null);
    });

    const params = { invoice_id: 'INV_001' };
    const result = await sendInvoice({}, mockVisaContext, params);

    expect(mockSendInvoice).toHaveBeenCalledTimes(1);
    expect(mockSendInvoice).toHaveBeenCalledWith('INV_001', expect.any(Function));
    expect(result).toEqual('Failed to send invoice');
  });
});