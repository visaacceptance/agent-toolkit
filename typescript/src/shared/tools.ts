/* © 2025 Visa.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
/* START GENAI */
import { z } from 'zod';
import { VisaContext } from './types';

// We need to update all the invoice and payment link files to use named exports
// For now, let's use default imports until all files are updated
import createInvoiceToolModule from './invoices/createInvoice';
import updateInvoiceToolModule from './invoices/updateInvoice';
import getInvoiceToolModule from './invoices/getInvoice';
import listInvoicesToolModule from './invoices/listInvoices';
import sendInvoiceToolModule from './invoices/sendInvoice';
import cancelInvoiceToolModule from './invoices/cancelInvoice';
import createPaymentLinkToolModule from './paymentLinks/createPaymentLink';
import updatePaymentLinkToolModule from './paymentLinks/updatePaymentLink';
import getPaymentLinkToolModule from './paymentLinks/getPaymentLink';
import listPaymentLinkToolModule from './paymentLinks/listPaymentLinks';

export type Tool = {
  method: string;
  name: string;
  description: string;
  parameters: z.ZodObject<any, any, any, any>;
  actions: {
    [resource: string]: {
      [action: string]: boolean;
    }
  };
  execute: (visaClient: any, context: VisaContext, params: any) => Promise<any>;
};

// Rename the function to avoid naming conflict with the export
export function createTools(context: VisaContext): Tool[] {
  return [
    createInvoiceToolModule(context),
    updateInvoiceToolModule(context),
    getInvoiceToolModule(context),
    listInvoicesToolModule(context),
    sendInvoiceToolModule(context),
    cancelInvoiceToolModule(context),
    createPaymentLinkToolModule(context),
    updatePaymentLinkToolModule(context),
    getPaymentLinkToolModule(context),
    listPaymentLinkToolModule(context)
  ];
}

// Export the function with an alias for compatibility
export { createTools as tools };

export default createTools;
/* END GENAI */