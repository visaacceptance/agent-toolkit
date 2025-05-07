import { z } from 'zod';
import { VisaContext } from './types';


// Import invoice tools
import createInvoiceToolModule from './invoices/createInvoice';
import listInvoicesToolModule from './invoices/listInvoices';
import getInvoiceToolModule from './invoices/getInvoice';
import updateInvoiceToolModule from './invoices/updateInvoice';

/**
 * Tool interface defining the structure of a tool
 */
export type Tool = {
  method: string;                // Unique identifier for the tool
  name: string;                  // Display name
  description: string;           // Description for AI consumption
  parameters: z.ZodObject<any, any, any, any>;
  actions: {                     // Permission structure
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
    // Use the new modular invoice tools
    createInvoiceToolModule(context),
    listInvoicesToolModule(context),
    getInvoiceToolModule(context),
    updateInvoiceToolModule(context)
  ];
}

// Also export as default for backward compatibility
export default tools;