# Integration Tests

This directory contains integration tests for the Visa Acceptance Agent Toolkit. These tests validate the functionality of the toolkit against the actual Visa Acceptance API endpoints.

## Prerequisites

- Node.js (version 18 or higher)
- npm (comes with Node.js)
- Visa Acceptance API credentials

## Setup Instructions

### 1. Configure Environment Variables

The integration tests require valid Visa Acceptance API credentials to run successfully. Follow these steps to set up your environment:

1. Locate the template file in this directory:
   ```
   typescript/src/test/integration/.env.test.template
   ```

2. Create a copy of this file named `.env.test` in the same directory:
   ```
   typescript/src/test/integration/.env.test
   ```

3. Open the `.env.test` file and fill in your Visa Acceptance API credentials:
   ```
   VISA_ACCEPTANCE_MERCHANT_ID="your_merchant_id"
   VISA_ACCEPTANCE_API_KEY_ID="your_api_key_id"
   VISA_ACCEPTANCE_SECRET_KEY="your_secret_key"
   NODE_TLS_REJECT_UNAUTHORIZED=1
   ACCEPTANCE_TOOLS=all
   VISA_ACCEPTANCE_ENVIRONMENT=SANDBOX
   ```

   > **Note:** The `VISA_ACCEPTANCE_ENVIRONMENT` is set to `SANDBOX` by default. Do not change this unless you specifically need to test against the production environment.

### 2. Verify Configuration

Ensure that your `.env.test` file:
- Contains all required credentials
- Is properly formatted
- Is saved in the correct location

## Running the Tests

Once you have set up your environment variables, you can run the integration tests with the following command from the `typescript` directory:

```bash
npm run test:integration
```

This command will execute all integration tests in the `src/test/integration` directory using Jest.

## Test Structure

The integration tests are organized by feature. For example:

- `shared/invoices/` - Tests for invoice-related functionality
- `shared/paymentLinks/` - Tests for payment link functionality

Each test file focuses on a specific set of related functions and validates their behavior against the actual API.

## Troubleshooting

If you encounter issues running the tests:

1. Verify that your credentials in the `.env.test` file are correct
2. Ensure you're running the command from the `typescript` directory
3. Check that you have the required Node.js version (18+)
4. Verify your network connection and access to the Visa Acceptance API endpoints

## Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Visa Acceptance API Documentation](https://developer.visaacceptance.com/api-reference-assets/index.html)
