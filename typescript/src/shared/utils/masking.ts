/**
 * Utility functions for masking PII data according to security requirements.
 * Limits plaintext exposure, applies masking to appropriate portions of the data,
 * and uses '*' for consistent masking to protect sensitive information.
 */

/**
 * Masks a PII string according to security requirements
 * @param value The PII string to mask
 * @param maskPosition Where to apply the masking ('start', 'end', or 'random')
 * @returns The masked string
 */
export function maskPII(value: string, maskPosition: 'start' | 'end' | 'random' = 'end'): string {
  if (!value) return value;
  
  const maxVisibleChars = Math.min(3, Math.floor(value.length * 0.3));
  const charsToMask = value.length - maxVisibleChars;
  const mask = '*'.repeat(charsToMask);
  
  switch (maskPosition) {
    case 'start':
      return mask + value.slice(-maxVisibleChars);
    
    case 'end':
      return value.slice(0, maxVisibleChars) + mask;
    
    case 'random':
      const chars = value.split('');
      const positions = Array.from({ length: value.length }, (_, i) => i);
      
      for (let i = positions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [positions[i], positions[j]] = [positions[j], positions[i]];
      }
      
      for (let i = 0; i < charsToMask; i++) {
        chars[positions[i]] = '*';
      }
      
      return chars.join('');
  }
}

/**
 * Masks customer information in an invoice object
 * @param invoice The invoice object containing customer information
 * @returns The invoice with masked customer information
 */
export function maskInvoiceCustomerInfo(invoice: any): any {
  if (!invoice) return invoice;
  
  const maskedInvoice = JSON.parse(JSON.stringify(invoice));
  
  if (maskedInvoice.customerInformation) {
    if (maskedInvoice.customerInformation.name) {
      maskedInvoice.customerInformation.name = maskPII(maskedInvoice.customerInformation.name, 'end');
    }
    
    if (maskedInvoice.customerInformation.email) {
      /**
       * For emails, mask the local part but keep the domain visible for better usability
       */
      const emailParts = maskedInvoice.customerInformation.email.split('@');
      if (emailParts.length === 2) {
        const maskedLocalPart = maskPII(emailParts[0], 'end');
        maskedInvoice.customerInformation.email = `${maskedLocalPart}@${emailParts[1]}`;
      } else {
        maskedInvoice.customerInformation.email = maskPII(maskedInvoice.customerInformation.email, 'end');
      }
    }
  }
  
  return maskedInvoice;
}

/**
 * Masks customer information in an array of invoice objects
 * @param invoices Array of invoice objects
 * @returns Array of invoices with masked customer information
 */
export function maskInvoicesCustomerInfo(invoices: any[]): any[] {
  if (!invoices || !Array.isArray(invoices)) return invoices;
  
  return invoices.map(invoice => maskInvoiceCustomerInfo(invoice));
}