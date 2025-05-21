import { z } from 'zod';
import { VisaContext } from './types';


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

/**
 * Tool interface defining the structure of a tool
 */
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


/**
 * Export a function that returns all tools with context applied
 */
export function tools(context: VisaContext): Tool[] {
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

/**
 * Default export for backward compatibility
 */
export default tools;