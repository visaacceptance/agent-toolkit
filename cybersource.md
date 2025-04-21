# Cybersource MCP Server

This MCP server provides integration with common Cybersource functionalities, exposing them as convenient tools. Below is a list of the tools currently available, along with brief details on how to use each one.

---

## 1. process_refund

• Description: Processes a refund for a previous transaction.  
• Tool Name: process_refund  
• Required Parameters:
  - transaction_id (string) — The ID of the original transaction.  
• Optional Parameters:
  - amount (number) — The amount to refund. If omitted, the full amount is refunded.  
  - currency (string) — The currency code (defaults to "USD" if omitted).  

### Example Usage
<use_mcp_tool>
  <server_name>cybersource</server_name>
  <tool_name>process_refund</tool_name>
  <arguments>
  {
    "transaction_id":"TX12345",
    "amount": 40,
    "currency": "USD"
  }
  </arguments>
</use_mcp_tool>

---

## 2. greeting

• Description: A simple tool that returns a greeting message.  
• Tool Name: greeting  
• Required/Optional Parameters:
  - greeting (string) — The greeting message to output.  

### Example Usage
<use_mcp_tool>
  <server_name>cybersource</server_name>
  <tool_name>greeting</tool_name>
  <arguments>
  {
    "greeting": "Hello from Cybersource!"
  }
  </arguments>
</use_mcp_tool>

---

## 3. checkout.create_context

• Description: Generates a capture context for payment processing, useful for building a payment form or checkout flow.  
• Tool Name: checkout.create_context  
• Required Parameters:
  - merchant_id (string)  
• Optional Parameters:
  - currency (string) — Defaults to "USD".  
  - amount (number) — Transaction amount.  
  - allowed_card_networks (array of strings) — Acceptable card networks. Default is ["VISA","MASTERCARD","AMEX"].  
  - allowed_payment_types (array of strings) — Defaults to ["CLICKTOPAY","PANENTRY","GOOGLEPAY"].  
  - country (string) — Defaults to "US".  
  - locale (string) — Defaults to "en_US".  
  - capture_mandate (object) — Additional capture preferences.  
  - bill_to (object) — Billing info.  
  - ship_to (object) — Shipping info.  

### Example Usage
<use_mcp_tool>
  <server_name>cybersource</server_name>
  <tool_name>checkout.create_context</tool_name>
  <arguments>
  {
    "merchant_id": "your-merchant-id",
    "amount": 100
  }
</arguments>
</use_mcp_tool>

---

## 4. create_payment_link

• Description: Creates a pay-by-link for a purchase, allowing you to generate a URL your customers can follow to complete payment.  
• Tool Name: create_payment_link  
• Required Parameters:
  - linkType (string) — e.g. "PURCHASE".  
  - purchaseNumber (string) — Unique purchase identifier (alphanumeric).  
  - currency (string) — e.g. "USD".  
  - totalAmount (string) — e.g. "999".  
  - lineItems (array) — Each item with fields like productName, quantity, and unitPrice.  

### Example Usage
<use_mcp_tool>
  <server_name>cybersource</server_name>
  <tool_name>create_payment_link</tool_name>
  <arguments>
  {
    "linkType": "PURCHASE",
    "purchaseNumber": "34567iphone",
    "currency": "USD",
    "totalAmount": "999",
    "lineItems": [
      {
        "productName": "iPhone 18",
        "quantity": "1",
        "unitPrice": "999"
      }
    ]
  }
</arguments>
</use_mcp_tool>

---

## 5. search_transactions

• Description: Searches Cybersource transactions using the advanced query syntax.  
• Tool Name: search_transactions  
• Required/Optional Parameters:
  - query (string) — The advanced query, e.g. "submitTimeUtc:[NOW/DAY-7DAYS TO NOW/DAY+1DAY]"  

### Example Usage
<use_mcp_tool>
  <server_name>cybersource</server_name>
  <tool_name>search_transactions</tool_name>
  <arguments>
  {
    "query": "submitTimeUtc:[NOW/DAY-7DAYS TO NOW/DAY+1DAY]"
  }
</arguments>
</use_mcp_tool>

---

## 6. security.audit

• Description: Analyzes the codebase for usage of p12 or message-level encryption configuration. Provides a summary of potential rule violations in the merchant's code.  
• Tool Name: security.audit  
• Optional Parameters:
  - path (string) — Directory path to analyze. Defaults to the current directory if omitted.  

### Example Usage
<use_mcp_tool>
  <server_name>cybersource</server_name>
  <tool_name>security.audit</tool_name>
  <arguments>
  {
    "path": "modelcontextprotocol"
  }
</arguments>
</use_mcp_tool>

---

## Additional Notes

- Each tool returns a JSON response.  
- For many operations, you can optionally provide a <requires_approval>true</requires_approval> or <requires_approval>false</requires_approval> parameter when calling a tool if the command is potentially destructive or requires confirmation.  
- Refer to the respective input schemas for detailed usage, including which parameters are required or optional.
