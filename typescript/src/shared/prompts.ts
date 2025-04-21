import type {Context} from './configuration';

export const createPaymentLinkPrompt = (context: Context = {}) => `
This tool will create a payment link in Cybersource.

Create a pay-by-link for a purchase using the new PayByLink code.
`;

export const createInvoicePrompt = (context: Context = {}) => `
This tool will create an invoice in Cybersource.

Create an invoice.
`;