/* © 2025 Visa.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import { VisaContext } from '../types';

/**
 * Sets the developer ID in the request object based on the context mode
 * @param requestObj The request object to update
 * @param context The Visa context containing the mode
 * @returns The updated request object
 */
export function setDeveloperId(requestObj: any, context: VisaContext): any {
  // Initialize clientReferenceInformation if it doesn't exist
  if (!requestObj.clientReferenceInformation) {
    requestObj.clientReferenceInformation = {};
  }
  
  
  // Initialize partner object if it doesn't exist
  if (!requestObj.clientReferenceInformation.partner) {
    requestObj.clientReferenceInformation.partner = {};
  }
  // Set the developer ID based on the context mode
  requestObj.clientReferenceInformation.partner.developerId = 
    context?.mode === 'modelcontextprotocol' ? 'N05YN5UH' : 'A2R8EP3K';
    
  
  return requestObj;
}