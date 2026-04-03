/* © 2025 Visa.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

// Node.js global declarations
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      VISA_ACCEPTANCE_MERCHANT_ID?: string;
      VISA_ACCEPTANCE_API_KEY_ID?: string;
      VISA_ACCEPTANCE_SECRET_KEY?: string;
      VISA_ACCEPTANCE_ENVIRONMENT?: string;
      KEY_ALIAS?: string;
      KEY_PASS?: string;
      KEY_FILENAME?: string;
      KEYS_DIRECTORY?: string;
      USE_META_KEY?: string;
      PORTFOLIO_ID?: string;
      PEM_FILE_DIRECTORY?: string;
      DEFAULT_DEVELOPER_ID?: string;
    }
  }

  var process: NodeJS.Process;
  var require: NodeRequire;
  var module: NodeModule;
}

export {};
