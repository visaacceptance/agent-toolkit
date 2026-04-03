/* © 2025 Visa.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import { createPaymentLink } from '../../../../shared/paymentLinks/createPaymentLink';
import { getPaymentLink } from '../../../../shared/paymentLinks/getPaymentLink';
import { listPaymentLinks } from '../../../../shared/paymentLinks/listPaymentLinks';
import { updatePaymentLink } from '../../../../shared/paymentLinks/updatePaymentLink';
import { mockVisaContext } from '../helper';

jest.mock('cybersource-rest-client', () => ({
  PaymentLinksApi: jest.fn(),
  Iplv2paymentlinksProcessingInformation: jest.fn(),
  Iplv2paymentlinksPurchaseInformation: jest.fn(),
  Iplv2paymentlinksOrderInformationAmountDetails: jest.fn(),
  Iplv2paymentlinksOrderInformationLineItems: jest.fn(),
  Iplv2paymentlinksOrderInformation: jest.fn(),
  CreatePaymentLinkRequest: jest.fn(),
  UpdatePaymentLinkRequest: jest.fn(),
  Invoicingv2invoicesClientReferenceInformation: jest.fn()
}));

describe('createPaymentLink', () => {
  let mockCreatePaymentLink: jest.Mock;
  let mockProcessingInformation: jest.Mock;
  let mockPurchaseInformation: jest.Mock;
  let mockAmountDetails: jest.Mock;
  let mockLineItems: jest.Mock;
  let mockOrderInformation: jest.Mock;
  let mockCreatePaymentLinkRequest: jest.Mock;
  let mockClientReferenceInformation: jest.Mock;

  beforeEach(() => {
    mockCreatePaymentLink = jest.fn();
    mockProcessingInformation = jest.fn();
    mockPurchaseInformation = jest.fn();
    mockAmountDetails = jest.fn();
    mockLineItems = jest.fn();
    mockOrderInformation = jest.fn();
    mockCreatePaymentLinkRequest = jest.fn();
    mockClientReferenceInformation = jest.fn();

    const cybersourceRestApi = require('cybersource-rest-client');
    cybersourceRestApi.PaymentLinksApi.mockImplementation(() => ({
      createPaymentLink: mockCreatePaymentLink
    }));
    cybersourceRestApi.Iplv2paymentlinksProcessingInformation = mockProcessingInformation;
    cybersourceRestApi.Iplv2paymentlinksPurchaseInformation = mockPurchaseInformation;
    cybersourceRestApi.Iplv2paymentlinksOrderInformationAmountDetails = mockAmountDetails;
    cybersourceRestApi.Iplv2paymentlinksOrderInformationLineItems = mockLineItems;
    cybersourceRestApi.Iplv2paymentlinksOrderInformation = mockOrderInformation;
    cybersourceRestApi.CreatePaymentLinkRequest = mockCreatePaymentLinkRequest;
    cybersourceRestApi.Invoicingv2invoicesClientReferenceInformation = mockClientReferenceInformation;
  });

  it('should successfully create a payment link', async () => {
    const mockApiResult = {
      id: 'LINK_001',
      status: 'ACTIVE',
      url: 'https://example.com/pay/LINK_001'
    };
    mockCreatePaymentLink.mockImplementation((requestObj, callback) => {
      callback(null, mockApiResult);
    });

    const params = {
      linkType: 'PURCHASE',
      purchaseNumber: 'PURCHASE_001',
      currency: 'USD',
      totalAmount: '100.00',
      requestPhone: false,
      requestShipping: false,
      lineItems: [{
        productName: 'Test Product',
        quantity: '1',
        unitPrice: '100.00'
      }]
    };
    const result = await createPaymentLink({}, mockVisaContext, params);

    expect(mockProcessingInformation).toHaveBeenCalledWith(params.linkType, params.requestPhone, params.requestShipping);
    expect(mockPurchaseInformation).toHaveBeenCalledWith(params.purchaseNumber);
    expect(mockAmountDetails).toHaveBeenCalledWith(params.currency);
    expect(mockLineItems).toHaveBeenCalledTimes(params.lineItems.length);
    expect(mockOrderInformation).toHaveBeenCalled();
    expect(mockCreatePaymentLinkRequest).toHaveBeenCalled();
    expect(mockCreatePaymentLink).toHaveBeenCalledTimes(1);
    expect(mockCreatePaymentLink).toHaveBeenCalledWith(expect.any(Object), expect.any(Function));
    expect(result).toEqual(mockApiResult);
  });

  it('should handle API errors gracefully', async () => {
    const apiErrorMessage = 'API Error: Unable to create payment link';
    mockCreatePaymentLink.mockImplementation((requestObj, callback) => {
      callback({ message: apiErrorMessage }, null);
    });

    const params = {
      linkType: 'PURCHASE',
      purchaseNumber: 'PURCHASE_001',
      currency: 'USD',
      totalAmount: '100.00',
      requestPhone: false,
      requestShipping: false,
      lineItems: [{
        productName: 'Test Product',
        quantity: '1',
        unitPrice: '100.00'
      }]
    };
    const result = await createPaymentLink({}, mockVisaContext, params);

    expect(mockCreatePaymentLink).toHaveBeenCalledTimes(1);
    expect(result).toEqual('Failed to create payment link');
  });
});

describe('getPaymentLink', () => {
  let mockGetPaymentLink: jest.Mock;

  beforeEach(() => {
    mockGetPaymentLink = jest.fn();
    (require('cybersource-rest-client').PaymentLinksApi as jest.Mock).mockImplementation(() => ({
      getPaymentLink: mockGetPaymentLink
    }));
  });

  it('should successfully get a payment link', async () => {
    const mockApiResult = {
      id: 'LINK_001',
      status: 'ACTIVE',
      url: 'https://example.com/pay/LINK_001'
    };
    mockGetPaymentLink.mockImplementation((id, callback) => {
      callback(null, mockApiResult);
    });

    const params = { id: 'LINK_001' };
    const result = await getPaymentLink({}, mockVisaContext, params);

    expect(mockGetPaymentLink).toHaveBeenCalledTimes(1);
    expect(mockGetPaymentLink).toHaveBeenCalledWith('LINK_001', expect.any(Function));
    expect(result).toEqual(mockApiResult);
  });

  it('should handle API errors gracefully', async () => {
    const apiErrorMessage = 'API Error: Unable to get payment link';
    mockGetPaymentLink.mockImplementation((id, callback) => {
      callback({ message: apiErrorMessage }, null);
    });

    const params = { id: 'LINK_001' };
    const result = await getPaymentLink({}, mockVisaContext, params);

    expect(mockGetPaymentLink).toHaveBeenCalledTimes(1);
    expect(mockGetPaymentLink).toHaveBeenCalledWith('LINK_001', expect.any(Function));
    expect(result).toEqual('Failed to get payment link');
  });
});

describe('listPaymentLinks', () => {
  let mockListPaymentLinks: jest.Mock;

  beforeEach(() => {
    mockListPaymentLinks = jest.fn();
    (require('cybersource-rest-client').PaymentLinksApi as jest.Mock).mockImplementation(() => ({
      getAllPaymentLinks: mockListPaymentLinks
    }));
  });

  it('should successfully list payment links', async () => {
    const mockApiResult = {
      links: [
        { id: 'LINK_001', status: 'ACTIVE' },
        { id: 'LINK_002', status: 'EXPIRED' }
      ],
      offset: 0,
      limit: 2,
      count: 2
    };
    mockListPaymentLinks.mockImplementation((offset, limit, opts, callback) => {
      callback(null, mockApiResult);
    });

    const params = { offset: 0, limit: 2 };
    const result = await listPaymentLinks({}, mockVisaContext, params);

    expect(mockListPaymentLinks).toHaveBeenCalledTimes(1);
    expect(mockListPaymentLinks).toHaveBeenCalledWith(0, 2, {}, expect.any(Function));
    expect(result).toEqual(mockApiResult);
  });

  it('should handle API errors gracefully', async () => {
    const apiErrorMessage = 'API Error: Unable to list payment links';
    mockListPaymentLinks.mockImplementation((offset, limit, opts, callback) => {
      callback({ message: apiErrorMessage }, null);
    });

    const params = { offset: 0, limit: 2 };
    const result = await listPaymentLinks({}, mockVisaContext, params);

    expect(mockListPaymentLinks).toHaveBeenCalledTimes(1);
    expect(mockListPaymentLinks).toHaveBeenCalledWith(0, 2, {}, expect.any(Function));
    expect(result).toEqual('Failed to list payment links');
  });
});

describe('updatePaymentLink', () => {
  let mockUpdatePaymentLink: jest.Mock;
  let mockProcessingInformation: jest.Mock;
  let mockPurchaseInformation: jest.Mock;
  let mockAmountDetails: jest.Mock;
  let mockLineItems: jest.Mock;
  let mockOrderInformation: jest.Mock;
  let mockUpdatePaymentLinkRequest: jest.Mock;
  let mockClientReferenceInformation: jest.Mock;

  beforeEach(() => {
    mockUpdatePaymentLink = jest.fn();
    mockProcessingInformation = jest.fn();
    mockPurchaseInformation = jest.fn();
    mockAmountDetails = jest.fn();
    mockLineItems = jest.fn();
    mockOrderInformation = jest.fn();
    mockUpdatePaymentLinkRequest = jest.fn();
    mockClientReferenceInformation = jest.fn();

    const cybersourceRestApi = require('cybersource-rest-client');
    cybersourceRestApi.PaymentLinksApi.mockImplementation(() => ({
      updatePaymentLink: mockUpdatePaymentLink
    }));
    cybersourceRestApi.Iplv2paymentlinksProcessingInformation = mockProcessingInformation;
    cybersourceRestApi.Iplv2paymentlinksPurchaseInformation = mockPurchaseInformation;
    cybersourceRestApi.Iplv2paymentlinksOrderInformationAmountDetails = mockAmountDetails;
    cybersourceRestApi.Iplv2paymentlinksOrderInformationLineItems = mockLineItems;
    cybersourceRestApi.Iplv2paymentlinksOrderInformation = mockOrderInformation;
    cybersourceRestApi.UpdatePaymentLinkRequest = mockUpdatePaymentLinkRequest;
    cybersourceRestApi.Invoicingv2invoicesClientReferenceInformation = mockClientReferenceInformation;
  });

  it('should successfully update a payment link', async () => {
    const mockApiResult = {
      id: 'LINK_001',
      status: 'ACTIVE',
      url: 'https://example.com/pay/LINK_001',
      totalAmount: '150.00'
    };
    mockUpdatePaymentLink.mockImplementation((id, requestObj, callback) => {
      callback(null, mockApiResult);
    });

    const params = {
      id: 'LINK_001',
      totalAmount: '150.00',
      currency: 'USD'
    };
    const result = await updatePaymentLink({}, mockVisaContext, params);

    expect(mockAmountDetails).toHaveBeenCalledWith(params.currency);
    expect(mockOrderInformation).toHaveBeenCalled();
    expect(mockUpdatePaymentLinkRequest).toHaveBeenCalled();
    expect(mockUpdatePaymentLink).toHaveBeenCalledTimes(1);
    expect(mockUpdatePaymentLink).toHaveBeenCalledWith('LINK_001', expect.any(Object), expect.any(Function));
    expect(result).toEqual(mockApiResult);
  });

  it('should handle API errors gracefully', async () => {
    const apiErrorMessage = 'API Error: Unable to update payment link';
    mockUpdatePaymentLink.mockImplementation((id, requestObj, callback) => {
      callback({ message: apiErrorMessage }, null);
    });

    mockAmountDetails.mockReturnValue({
      totalAmount: '150.00',
      currency: 'USD'
    });

    mockOrderInformation.mockReturnValue({
      amountDetails: {
        totalAmount: '150.00',
        currency: 'USD'
      }
    });

    const params = {
      id: 'LINK_001',
      totalAmount: '150.00',
      currency: 'USD'
    };
    const result = await updatePaymentLink({}, mockVisaContext, params);

    expect(mockAmountDetails).toHaveBeenCalledWith('USD');
    expect(mockOrderInformation).toHaveBeenCalledWith(expect.any(Object));
    expect(mockUpdatePaymentLinkRequest).toHaveBeenCalled();
    expect(mockUpdatePaymentLink).toHaveBeenCalledTimes(1);
    expect(mockUpdatePaymentLink).toHaveBeenCalledWith(
      'LINK_001',
      expect.objectContaining({
        orderInformation: expect.objectContaining({
          amountDetails: expect.objectContaining({
            totalAmount: '150.00',
            currency: 'USD'
          })
        })
      }),
      expect.any(Function)
    );
    expect(result).toEqual('Failed to update payment link');
  });
});
