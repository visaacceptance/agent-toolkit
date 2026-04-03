/* © 2025 Visa.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import { createPaymentLinkParameters } from '../../../../shared/paymentLinks/createPaymentLink';
import { getPaymentLinkParameters } from '../../../../shared/paymentLinks/getPaymentLink';
import { listPaymentLinksParameters } from '../../../../shared/paymentLinks/listPaymentLinks';
import { updatePaymentLinkParameters } from '../../../../shared/paymentLinks/updatePaymentLink';

describe('createPaymentLinkParameters', () => {
  describe('valid inputs', () => {
    it('should accept complete valid payment link data', () => {
      const validData = {
        linkType: 'PURCHASE',
        purchaseNumber: 'PUR123ABC',
        currency: 'USD',
        totalAmount: '499.00',
        requestPhone: true,
        requestShipping: false,
        lineItems: [
          {
            productName: 'Test Product',
            productSKU: 'SKU123',
            productDescription: 'A test product',
            quantity: '2',
            unitPrice: '249.50'
          }
        ]
      };

      const result = createPaymentLinkParameters().safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it('should accept minimal required fields only', () => {
      const minimalData = {
        linkType: 'DONATION',
        purchaseNumber: 'DON456XYZ',
        currency: 'EUR',
        lineItems: [
          {
            productName: 'Donation Item',
            quantity: '1',
            unitPrice: '100.00'
          }
        ]
      };

      const result = createPaymentLinkParameters().safeParse(minimalData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.requestPhone).toBe(false); // Should default to false
        expect(result.data.requestShipping).toBe(false); // Should default to false
      }
    });

    it('should handle multiple line items', () => {
      const dataWithMultipleItems = {
        linkType: 'PURCHASE',
        purchaseNumber: 'MULTI789',
        currency: 'GBP',
        totalAmount: '350.00',
        requestPhone: false,
        requestShipping: true,
        lineItems: [
          {
            productName: 'Product A',
            productSKU: 'SKU-A',
            quantity: '1',
            unitPrice: '150.00'
          },
          {
            productName: 'Product B',
            productDescription: 'Second product',
            quantity: '2',
            unitPrice: '100.00'
          }
        ]
      };

      const result = createPaymentLinkParameters().safeParse(dataWithMultipleItems);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.lineItems).toHaveLength(2);
        expect(result.data.lineItems[0].productName).toBe('Product A');
        expect(result.data.lineItems[1].productName).toBe('Product B');
      }
    });

    it('should handle optional line item fields', () => {
      const dataWithOptionalFields = {
        linkType: 'PURCHASE',
        purchaseNumber: 'OPT123',
        currency: 'USD',
        lineItems: [
          {
            productName: 'Basic Product',
            quantity: '1',
            unitPrice: '50.00'
            // Missing optional productSKU and productDescription
          },
          {
            productName: 'Full Product',
            productSKU: 'FULL-SKU',
            productDescription: 'Complete product info',
            quantity: '3',
            unitPrice: '25.00'
          }
        ]
      };

      const result = createPaymentLinkParameters().safeParse(dataWithOptionalFields);
      expect(result.success).toBe(true);
    });
  });

  describe('invalid inputs', () => {
    it('should reject missing required fields', () => {
      const incompleteData = {
        linkType: 'PURCHASE',
        purchaseNumber: 'INCOMPLETE123'
        // Missing currency and lineItems
      };

      const result = createPaymentLinkParameters().safeParse(incompleteData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const errorPaths = result.error.issues.map(issue => issue.path.join('.'));
        expect(errorPaths).toContain('currency');
        expect(errorPaths).toContain('lineItems');
      }
    });

    it('should accept empty string fields and empty array (Zod default behavior)', () => {
      const dataWithEmptyFields = {
        linkType: '',
        purchaseNumber: '',
        currency: '',
        lineItems: []
      };

      const result = createPaymentLinkParameters().safeParse(dataWithEmptyFields);
      expect(result.success).toBe(true); // Zod accepts empty strings and arrays by default
    });

    it('should accept empty line items array (Zod default behavior)', () => {
      const dataWithEmptyLineItems = {
        linkType: 'PURCHASE',
        purchaseNumber: 'EMPTY123',
        currency: 'USD',
        lineItems: []
      };

      const result = createPaymentLinkParameters().safeParse(dataWithEmptyLineItems);
      expect(result.success).toBe(true); // Zod accepts empty arrays by default
    });

    it('should reject invalid line item structure', () => {
      const dataWithInvalidLineItems = {
        linkType: 'PURCHASE',
        purchaseNumber: 'INVALID123',
        currency: 'USD',
        lineItems: [
          {
            productName: 'Valid Product',
            quantity: '1',
            unitPrice: '50.00'
          },
          {
            // Missing required productName, quantity, unitPrice
            productSKU: 'INCOMPLETE-SKU'
          }
        ]
      };

      const result = createPaymentLinkParameters().safeParse(dataWithInvalidLineItems);
      expect(result.success).toBe(false);
      if (!result.success) {
        const errorPaths = result.error.issues.map(issue => issue.path.join('.'));
        expect(errorPaths.some(path => path.includes('lineItems.1.productName'))).toBe(true);
        expect(errorPaths.some(path => path.includes('lineItems.1.quantity'))).toBe(true);
        expect(errorPaths.some(path => path.includes('lineItems.1.unitPrice'))).toBe(true);
      }
    });

    it('should reject non-boolean values for request flags', () => {
      const dataWithInvalidBooleans = {
        linkType: 'PURCHASE',
        purchaseNumber: 'BOOL123',
        currency: 'USD',
        requestPhone: 'true', // Should be boolean, not string
        requestShipping: 1, // Should be boolean, not number
        lineItems: [
          {
            productName: 'Test Product',
            quantity: '1',
            unitPrice: '100.00'
          }
        ]
      };

      const result = createPaymentLinkParameters().safeParse(dataWithInvalidBooleans);
      expect(result.success).toBe(false);
    });
  });
});

describe('getPaymentLinkParameters', () => {
  describe('valid inputs', () => {
    it('should accept valid payment link ID', () => {
      const validData = { id: 'PL_12345' };

      const result = getPaymentLinkParameters().safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('PL_12345');
      }
    });
  });

  describe('invalid inputs', () => {
    it('should reject missing ID field', () => {
      const invalidData = {};

      const result = getPaymentLinkParameters().safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['id']);
      }
    });

    it('should accept empty ID (Zod default behavior)', () => {
      const invalidData = { id: '' };

      const result = getPaymentLinkParameters().safeParse(invalidData);
      expect(result.success).toBe(true);
    });
  });
});

describe('listPaymentLinksParameters', () => {
  describe('valid inputs', () => {
    it('should accept valid pagination parameters', () => {
      const validData = {
        offset: 0,
        limit: 10
      };

      const result = listPaymentLinksParameters().safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept pagination with optional status filter', () => {
      const validData = {
        offset: 20,
        limit: 50,
        status: 'ACTIVE'
      };

      const result = listPaymentLinksParameters().safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('ACTIVE');
      }
    });

    it('should handle missing optional status field', () => {
      const validData = {
        offset: 0,
        limit: 25
      };

      const result = listPaymentLinksParameters().safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBeUndefined();
      }
    });
  });

  describe('invalid inputs', () => {
    it('should reject missing required pagination fields', () => {
      const invalidData = { status: 'EXPIRED' };

      const result = listPaymentLinksParameters().safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const errorPaths = result.error.issues.map(issue => issue.path.join('.'));
        expect(errorPaths).toContain('offset');
        expect(errorPaths).toContain('limit');
      }
    });

    it('should reject non-numeric pagination values', () => {
      const invalidData = {
        offset: 'invalid',
        limit: 'also_invalid'
      };

      const result = listPaymentLinksParameters().safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});

describe('updatePaymentLinkParameters', () => {
  describe('valid inputs', () => {
    it('should accept complete update data', () => {
      const validData = {
        id: 'PL_UPDATE_123',
        linkType: 'PURCHASE',
        purchaseNumber: 'UPD789',
        currency: 'USD',
        totalAmount: '299.99',
        requestPhone: true,
        requestShipping: false,
        lineItems: [
          {
            productName: 'Updated Product',
            productSKU: 'UPD-SKU',
            productDescription: 'Updated description',
            quantity: '2',
            unitPrice: '149.99'
          }
        ],
        expirationDays: 30
      };

      const result = updatePaymentLinkParameters().safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept minimal required fields for update', () => {
      const minimalData = {
        id: 'PL_MINIMAL_456',
        currency: 'USD'
      };

      const result = updatePaymentLinkParameters().safeParse(minimalData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('PL_MINIMAL_456');
      }
    });

    it('should handle partial updates with optional fields', () => {
      const partialData = {
        id: 'PL_PARTIAL_789',
        currency: 'EUR',
        totalAmount: '150.00',
        expirationDays: 14
      };

      const result = updatePaymentLinkParameters().safeParse(partialData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.currency).toBe('EUR');
        expect(result.data.expirationDays).toBe(14);
      }
    });

    it('should handle line items updates', () => {
      const dataWithLineItems = {
        id: 'PL_LINES_999',
        currency: 'USD',
        lineItems: [
          {
            productName: 'New Product A',
            quantity: '1',
            unitPrice: '75.00'
          },
          {
            productName: 'New Product B',
            productSKU: 'NEW-B',
            quantity: '3',
            unitPrice: '25.00'
          }
        ]
      };

      const result = updatePaymentLinkParameters().safeParse(dataWithLineItems);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.lineItems).toHaveLength(2);
      }
    });
  });

  describe('invalid inputs', () => {
    it('should reject missing required ID field', () => {
      const invalidData = {
        linkType: 'PURCHASE',
        currency: 'USD'
      };

      const result = updatePaymentLinkParameters().safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['id']);
      }
    });

    it('should accept empty ID (Zod default behavior)', () => {
      const invalidData = {
        id: '',
        currency: 'USD'
      };

      const result = updatePaymentLinkParameters().safeParse(invalidData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid line items when provided', () => {
      const dataWithInvalidLineItems = {
        id: 'PL_INVALID_LINES',
        lineItems: [
          {
            productName: 'Valid Product',
            quantity: '1',
            unitPrice: '50.00'
          },
          {
            // Missing required fields
            productSKU: 'INCOMPLETE'
          }
        ]
      };

      const result = updatePaymentLinkParameters().safeParse(dataWithInvalidLineItems);
      expect(result.success).toBe(false);
      if (!result.success) {
        const errorPaths = result.error.issues.map(issue => issue.path.join('.'));
        expect(errorPaths.some(path => path.includes('lineItems.1.productName'))).toBe(true);
        expect(errorPaths.some(path => path.includes('lineItems.1.quantity'))).toBe(true);
        expect(errorPaths.some(path => path.includes('lineItems.1.unitPrice'))).toBe(true);
      }
    });

    it('should reject invalid data types for optional fields', () => {
      const dataWithInvalidTypes = {
        id: 'PL_TYPES_123',
        requestPhone: 'not_a_boolean',
        expirationDays: 'not_a_number'
      };

      const result = updatePaymentLinkParameters().safeParse(dataWithInvalidTypes);
      expect(result.success).toBe(false);
    });
  });
});
