import {z} from 'zod';
import type {Context} from './configuration';
import { createInvoiceSchema, createPaymentLinkSchema } from './parameters';
import { createInvoicePrompt, createPaymentLinkPrompt } from './prompts';

export type Tool = {
    method: string;
    name: string;
    description: string;
    parameters: z.ZodObject<any, any, any, any>;
    actions: {
      [key: string]: {
        [action: string]: boolean;
      };
    };
  };

  const tools = (context: Context): Tool[] => [
    {
      method: 'create_payment_link',
      name: 'Create Payment Link',
      description: createPaymentLinkPrompt(context),
      parameters: createPaymentLinkSchema,
      actions: {
        paymentLinks: {
          create: true,
        },
      },
    },
    {
      method: 'create_invoice',
      name: 'Create Invoice',
      description: createInvoicePrompt(context),
      parameters: createInvoiceSchema,
      actions: {
        invoices: {
          create: true,
        },
      },
    }
  
  ];
  
  export default tools
