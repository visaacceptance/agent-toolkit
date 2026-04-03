/* © 2025 Visa.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import { createInvoiceParameters } from '../../../../shared/invoices/createInvoice';
import { getInvoiceParameters } from '../../../../shared/invoices/getInvoice';
import { listInvoicesParameters } from '../../../../shared/invoices/listInvoices';
import { updateInvoiceParameters } from '../../../../shared/invoices/updateInvoice';
import { cancelInvoiceParameters } from '../../../../shared/invoices/cancelInvoice';
import { sendInvoiceParameters } from '../../../../shared/invoices/sendInvoice';

describe('createInvoiceParameters', () => {
  describe('valid inputs', () => {
    it('should accept complete valid invoice data', () => {
      const validData = {
        invoice_number: 'INV123',
        totalAmount: '100.00',
        currency: 'USD',
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        invoiceInformation: {
          description: 'Test invoice',
          dueDate: '2024-12-31',
          sendImmediately: true,
          deliveryMode: 'email'
        }
      };

      const result = createInvoiceParameters().safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it('should accept minimal required fields only', () => {
      const minimalData = {
        invoice_number: 'INV456',
        totalAmount: '50.00',
        currency: 'EUR',
        invoiceInformation: {
          description: 'Minimal invoice',
          dueDate: '2024-06-15',
          sendImmediately: false,
          deliveryMode: 'email'
        }
      };

      const result = createInvoiceParameters().safeParse(minimalData);
      expect(result.success).toBe(true);
    });

    it('should handle optional customer fields when present', () => {
      const dataWithCustomer = {
        invoice_number: 'INV789',
        totalAmount: '75.50',
        currency: 'GBP',
        customerName: 'Jane Smith',
        customerEmail: 'jane@company.com',
        invoiceInformation: {
          description: 'Customer invoice',
          dueDate: '2024-08-20',
          sendImmediately: true,
          deliveryMode: 'email'
        }
      };

      const result = createInvoiceParameters().safeParse(dataWithCustomer);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.customerName).toBe('Jane Smith');
        expect(result.data.customerEmail).toBe('jane@company.com');
      }
    });
  });

  describe('invalid inputs', () => {
    it('should reject missing required fields', () => {
      const incompleteData = {
        invoice_number: 'INV123',
        totalAmount: '100.00'
        // Missing currency and invoiceInformation
      };

      const result = createInvoiceParameters().safeParse(incompleteData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const errorPaths = result.error.issues.map(issue => issue.path.join('.'));
        expect(errorPaths).toContain('currency');
        expect(errorPaths).toContain('invoiceInformation');
      }
    });

    it('should accept empty string fields (Zod default behavior)', () => {
      const dataWithEmptyFields = {
        invoice_number: '',
        totalAmount: '',
        currency: '',
        invoiceInformation: {
          description: '',
          dueDate: '',
          sendImmediately: true,
          deliveryMode: ''
        }
      };

      const result = createInvoiceParameters().safeParse(dataWithEmptyFields);
      expect(result.success).toBe(true);
    });

    it('should reject invalid nested invoice information', () => {
      const dataWithInvalidNested = {
        invoice_number: 'INV123',
        totalAmount: '100.00',
        currency: 'USD',
        invoiceInformation: {
          description: 'Valid description',
          // Missing dueDate, sendImmediately, deliveryMode
        }
      };

      const result = createInvoiceParameters().safeParse(dataWithInvalidNested);
      expect(result.success).toBe(false);
      if (!result.success) {
        const errorPaths = result.error.issues.map(issue => issue.path.join('.'));
        expect(errorPaths).toContain('invoiceInformation.dueDate');
        expect(errorPaths).toContain('invoiceInformation.sendImmediately');
        expect(errorPaths).toContain('invoiceInformation.deliveryMode');
      }
    });
  });
});

describe('getInvoiceParameters', () => {
  describe('valid inputs', () => {
    it('should accept valid invoice ID', () => {
      const validData = { id: 'INV_12345' };

      const result = getInvoiceParameters().safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('INV_12345');
      }
    });
  });

  describe('invalid inputs', () => {
    it('should reject missing ID field', () => {
      const invalidData = {};

      const result = getInvoiceParameters().safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['id']);
      }
    });

    it('should accept empty ID (Zod default behavior)', () => {
      const invalidData = { id: '' };

      const result = getInvoiceParameters().safeParse(invalidData);
      expect(result.success).toBe(true);
    });
  });
});

describe('listInvoicesParameters', () => {
  describe('valid inputs', () => {
    it('should accept valid pagination parameters', () => {
      const validData = {
        offset: 0,
        limit: 10
      };

      const result = listInvoicesParameters().safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept pagination with optional status filter', () => {
      const validData = {
        offset: 20,
        limit: 50,
        status: 'PAID'
      };

      const result = listInvoicesParameters().safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('PAID');
      }
    });

    it('should handle missing optional status field', () => {
      const validData = {
        offset: 0,
        limit: 25
      };

      const result = listInvoicesParameters().safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBeUndefined();
      }
    });
  });

  describe('invalid inputs', () => {
    it('should reject missing required pagination fields', () => {
      const invalidData = { status: 'PENDING' };

      const result = listInvoicesParameters().safeParse(invalidData);
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

      const result = listInvoicesParameters().safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});

describe('updateInvoiceParameters', () => {
  describe('valid inputs', () => {
    it('should accept complete update data', () => {
      const validData = {
        id: 'INV_12345',
        customerInformation: {
          email: 'updated@example.com',
          name: 'Updated Name'
        },
        invoiceInformation: {
          description: 'Updated description',
          dueDate: '2024-12-31',
          allowPartialPayments: true,
          deliveryMode: 'email'
        },
        orderInformation: {
          amountDetails: {
            totalAmount: '150.00',
            currency: 'USD',
            discountAmount: '10.00',
            discountPercent: 5,
            subAmount: 140.00,
            minimumPartialAmount: 50.00
          }
        }
      };

      const result = updateInvoiceParameters().safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept minimal required fields for update', () => {
      const minimalData = {
        id: 'INV_67890',
        customerInformation: {},
        invoiceInformation: {
          description: 'Minimal update',
          dueDate: '2024-06-30'
        },
        orderInformation: {
          amountDetails: {
            totalAmount: '200.00',
            currency: 'EUR'
          }
        }
      };

      const result = updateInvoiceParameters().safeParse(minimalData);
      expect(result.success).toBe(true);
    });
  });

  describe('invalid inputs', () => {
    it('should reject missing required nested fields', () => {
      const invalidData = {
        id: 'INV_12345',
        customerInformation: {},
        invoiceInformation: {
          description: 'Test'
          // Missing dueDate
        },
        orderInformation: {
          amountDetails: {
            totalAmount: '100.00'
            // Missing currency
          }
        }
      };

      const result = updateInvoiceParameters().safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const errorPaths = result.error.issues.map(issue => issue.path.join('.'));
        expect(errorPaths).toContain('invoiceInformation.dueDate');
        expect(errorPaths).toContain('orderInformation.amountDetails.currency');
      }
    });

    it('should reject missing top-level required objects', () => {
      const invalidData = {
        id: 'INV_12345'
        // Missing customerInformation, invoiceInformation, orderInformation
      };

      const result = updateInvoiceParameters().safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const errorPaths = result.error.issues.map(issue => issue.path.join('.'));
        expect(errorPaths).toContain('customerInformation');
        expect(errorPaths).toContain('invoiceInformation');
        expect(errorPaths).toContain('orderInformation');
      }
    });
  });
});

describe('cancelInvoiceParameters', () => {
  describe('valid inputs', () => {
    it('should accept valid invoice ID', () => {
      const validData = { invoice_id: 'INV_CANCEL_123' };

      const result = cancelInvoiceParameters().safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.invoice_id).toBe('INV_CANCEL_123');
      }
    });
  });

  describe('invalid inputs', () => {
    it('should reject missing invoice_id field', () => {
      const invalidData = {};

      const result = cancelInvoiceParameters().safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['invoice_id']);
      }
    });

    it('should accept empty invoice_id (Zod default behavior)', () => {
      const invalidData = { invoice_id: '' };

      const result = cancelInvoiceParameters().safeParse(invalidData);
      expect(result.success).toBe(true);
    });
  });
});

describe('sendInvoiceParameters', () => {
  describe('valid inputs', () => {
    it('should accept valid invoice ID', () => {
      const validData = { invoice_id: 'INV_SEND_456' };

      const result = sendInvoiceParameters().safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.invoice_id).toBe('INV_SEND_456');
      }
    });
  });

  describe('invalid inputs', () => {
    it('should reject missing invoice_id field', () => {
      const invalidData = {};

      const result = sendInvoiceParameters().safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['invoice_id']);
      }
    });

    it('should accept empty invoice_id (Zod default behavior)', () => {
      const invalidData = { invoice_id: '' };

      const result = sendInvoiceParameters().safeParse(invalidData);
      expect(result.success).toBe(true);
    });
  });
});
