import Cybersource, { InvoicingV2InvoicesPost201Response } from 'cybersource-rest-client';
import { z } from 'zod';
import type { Context } from './configuration';

export const createPaymentLink = async (
  context: Context
) => {
  try {
    return { id: "", url: "" };
  } catch (error) {
    return 'Failed to create payment link';
  }
};

export const createInvoice = async (
  cybersource: typeof Cybersource, clientReferenceInformationCode: string, invoiceTotalAmount: number, invoiceCurrency: string
) => {
  try {
    const invoiceRequest = {
      clientReferenceInformation: {
        code: clientReferenceInformationCode
      },
      orderInformation: {
        amountDetails: {
          totalAmount: invoiceTotalAmount,
          currency: invoiceCurrency
        }
      }
    };

    // Hypothetical InvoiceApi usage (replace with the actual class/method you need)
    var  invoiceApi = new cybersource.InvoicesApi();

    const invoiceResult: InvoicingV2InvoicesPost201Response = await new Promise((resolve, reject) => {
      invoiceApi.createInvoice(invoiceRequest, function (err: any, data: any) {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
});
    return { id: invoiceResult.id, url: invoiceResult.invoiceInformation?.paymentLink ?? "" };
  } catch (error) {
    return 'Failed to create invoice';
  }
};
