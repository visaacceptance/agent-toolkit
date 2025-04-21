import { z } from 'zod';

export const createPaymentLinkSchema = z.object({
  linkType: z.string().describe('Type of link to create, e.g. PURCHASE (required)'),
  purchaseNumber: z.string().describe('Letters/numbers only, up to 12 chars (required)'),
  currency: z.string().describe('Currency code, e.g. USD (required)'),
  totalAmount: z.string().describe('Total amount, e.g. 60 (required)'),
  lineItems: z.array(
    z.object({
      productName: z.string().describe('Product name (required)'),
      productSKU: z.string().describe('Product SKU (required)'),
      description: z.string().optional().describe('Description (optional)'),
      quantity: z.string().describe('Quantity (required)'),
      unitPrice: z.string().describe('Unit price (required)'),
      totalAmount: z.string().describe('Line item total (required)')
    })
  ).describe('Array of line items')
});



export const createInvoiceSchema = z.object({
  invoice_number: z.string().describe('Invoice number identifier (required)'),
  totalAmount: z.string().describe('Invoice total amount e.g. "100.00" (required)'),
  currency: z.string().describe('Invoice currency code e.g. "USD" (required)')
});

export type CreateInvoiceParams = z.infer<typeof createInvoiceSchema>;
export type CreatePaymentLinkParams = z.infer<typeof createPaymentLinkSchema>;