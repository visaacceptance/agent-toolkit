#!/usr/bin/env node

'use strict';

const cybersourceRestApi = require('cybersource-rest-client');
const axios = require('axios');
const dotenv = require('dotenv');
const getConfig = require('./config');
const { v4: uuidv4 } = require('uuid');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Load environment variables
dotenv.config();

/**
 * This script replicates exactly the successful API call pattern
 * from debug-target-origins.js and then applies it to both direct and MCP calls
 */
async function replicateSuccess() {
  console.log('='.repeat(80));
  console.log('REPLICATING SUCCESSFUL API CALL PATTERN');
  console.log('='.repeat(80));
  console.log('Environment:', process.env.CYBERSOURCE_USE_TEST_ENV === 'true' ? 'TEST' : 'PRODUCTION');
  console.log('Merchant ID:', process.env.CYBERSOURCE_MERCHANT_ID);
  
  try {
    // First, make a direct API call using exactly the working pattern
    console.log('\n' + '-'.repeat(80));
    console.log('TEST 1: DIRECT API CALL WITH COMPLETE REQUEST');
    console.log('-'.repeat(80));
    
    // Create API client instance for direct call
    const apiClient = new cybersourceRestApi.ApiClient();
    const configObject = getConfig();
    apiClient.setConfiguration(configObject);

    // This is the exact request creation pattern from debug-target-origins.js createCompleteRequest() function
    // which we know is successful
    const directRequest = createCompleteRequest();
    
    // Log the direct request structure in detail
    console.log('Direct API Request Structure:');
    
    // Save the request to a file for detailed inspection
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `replicated-request-${timestamp}.json`;
    const requestJson = JSON.stringify(directRequest, (key, value) => {
      if (key === 'constructor' || key === 'parent' || key === 'apiClient') {
        return '[Circular]';
      }
      return value;
    }, 2);
    
    fs.writeFileSync(filename, requestJson);
    console.log(`Saved complete request to ${filename}`);
    console.log(requestJson);
    
    // Create API instance for Unified Checkout
    const apiInstance = new cybersourceRestApi.UnifiedCheckoutCaptureContextApi(configObject, apiClient);
    
    // Execute the direct API call
    console.log('\nSending direct request to CyberSource...');
    
    try {
      const directResult = await new Promise((resolve, reject) => {
        apiInstance.generateUnifiedCheckoutCaptureContext(directRequest, (error, data, response) => {
          if (error) {
            reject(error);
          } else {
            resolve({ data, response });
          }
        });
      });
      
      console.log('\n✅ DIRECT API CALL SUCCEEDED');
      console.log('Direct API JWT token first 50 chars:', directResult.data.substring(0, 50) + '...');
      
      // Now, make an MCP call with the equivalent complete parameters
      console.log('\n' + '-'.repeat(80));
      console.log('TEST 2: MCP CALL WITH COMPLETE REQUEST');
      console.log('-'.repeat(80));
      
      // Convert the complete request to MCP format
      // Extract the properties from directRequest that need to be mapped to MCP arguments
      const mcpRequest = {
        server_name: 'cybersource-mcp-server',
        tool_name: 'checkout.create_context',
        arguments: {
          merchant_id: process.env.CYBERSOURCE_MERCHANT_ID,
          currency: directRequest.orderInformation.amountDetails.currency,
          amount: parseFloat(directRequest.orderInformation.amountDetails.totalAmount),
          allowed_card_networks: directRequest.allowedCardNetworks,
          allowed_payment_types: directRequest.allowedPaymentTypes,
          country: directRequest.country,
          locale: directRequest.locale,
          // Map captureMandate properly
          capture_mandate: {
            billing_type: directRequest.captureMandate.billingType,
            request_email: directRequest.captureMandate.requestEmail,
            request_phone: directRequest.captureMandate.requestPhone,
            request_shipping: directRequest.captureMandate.requestShipping,
            ship_to_countries: directRequest.captureMandate.shipToCountries,
            show_accepted_network_icons: directRequest.captureMandate.showAcceptedNetworkIcons
          },
          // Map billTo properly
          bill_to: {
            address1: directRequest.orderInformation.billTo.address1,
            address2: directRequest.orderInformation.billTo.address2,
            administrativeArea: directRequest.orderInformation.billTo.administrativeArea,
            buildingNumber: directRequest.orderInformation.billTo.buildingNumber,
            country: directRequest.orderInformation.billTo.country,
            district: directRequest.orderInformation.billTo.district,
            locality: directRequest.orderInformation.billTo.locality,
            postalCode: directRequest.orderInformation.billTo.postalCode,
            email: directRequest.orderInformation.billTo.email,
            firstName: directRequest.orderInformation.billTo.firstName,
            lastName: directRequest.orderInformation.billTo.lastName,
            middleName: directRequest.orderInformation.billTo.middleName,
            title: directRequest.orderInformation.billTo.title,
            phoneNumber: directRequest.orderInformation.billTo.phoneNumber,
            phoneType: directRequest.orderInformation.billTo.phoneType,
            company: {
              name: directRequest.orderInformation.billTo.company.name,
              address1: directRequest.orderInformation.billTo.company.address1,
              administrativeArea: directRequest.orderInformation.billTo.company.administrativeArea,
              buildingNumber: directRequest.orderInformation.billTo.company.buildingNumber,
              country: directRequest.orderInformation.billTo.company.country,
              district: directRequest.orderInformation.billTo.company.district,
              locality: directRequest.orderInformation.billTo.company.locality,
              postalCode: directRequest.orderInformation.billTo.company.postalCode
            }
          },
          // Map shipTo properly
          ship_to: {
            address1: directRequest.orderInformation.shipTo.address1,
            address2: directRequest.orderInformation.shipTo.address2,
            address3: directRequest.orderInformation.shipTo.address3,
            administrativeArea: directRequest.orderInformation.shipTo.administrativeArea,
            buildingNumber: directRequest.orderInformation.shipTo.buildingNumber,
            country: directRequest.orderInformation.shipTo.country,
            locality: directRequest.orderInformation.shipTo.locality,
            postalCode: directRequest.orderInformation.shipTo.postalCode,
            firstName: directRequest.orderInformation.shipTo.firstName,
            lastName: directRequest.orderInformation.shipTo.lastName
          }
        }
      };
      
      // Log the MCP request
      console.log('MCP Request Structure:');
      console.log(JSON.stringify(mcpRequest, null, 2));
      
      // Save the request to a file for detailed inspection
      const mcpFilename = `mcp-request-${timestamp}.json`;
      fs.writeFileSync(mcpFilename, JSON.stringify(mcpRequest, null, 2));
      console.log(`Saved MCP request to ${mcpFilename}`);
      
      // Set up for direct MCP server call
      const requestId = uuidv4();
      const mcpProcess = spawn('node', [path.join(__dirname, 'index.js')]);
      
      let responseData = '';
      let errorData = '';
      
      // Collect data from stdout
      mcpProcess.stdout.on('data', (data) => {
        const message = data.toString();
        console.log(`MCP stdout: ${message}`);
        responseData += message;
      });
      
      // Collect errors from stderr
      mcpProcess.stderr.on('data', (data) => {
        const message = data.toString();
        console.log(`MCP stderr: ${message}`);
        errorData += message;
      });
      
      try {
        // Process the response when MCP process completes
        const mcpResult = await new Promise((resolve, reject) => {
          mcpProcess.on('close', (code) => {
            if (code !== 0) {
              console.error(`MCP process exited with code ${code}`);
              reject(new Error(`MCP process exited with code ${code}. Error: ${errorData}`));
              return;
            }
            
            try {
              // Parse the MCP response
              const lines = responseData.split('\n').filter(line => line.trim());
              
              console.log('MCP Response Lines:', lines);
              
              // Find the response line
              for (const line of lines) {
                try {
                  const parsed = JSON.parse(line);
                  
                  // Handle JSON-RPC 2.0 response format
                  if (parsed.jsonrpc === '2.0' && parsed.result) {
                    console.log('Found valid JSON-RPC response with result');
                    resolve(parsed.result);
                    return;
                  }
                  
                  // Handle error response
                  if (parsed.jsonrpc === '2.0' && parsed.error) {
                    console.error('MCP returned an error:', parsed.error);
                    reject(new Error(parsed.error.message || 'MCP server returned an error'));
                    return;
                  }
                } catch (e) {
                  // Skip lines that aren't valid JSON
                  continue;
                }
              }
              
              // If we get here, we didn't find a valid response
              reject(new Error('Could not find valid MCP response in output'));
            } catch (error) {
              console.error('Error parsing MCP response:', error);
              reject(error);
            }
          });
        });
        
        // Send the request to the MCP server
        const rpcRequest = {
          jsonrpc: '2.0',
          id: requestId,
          method: 'tools/call',
          params: {
            name: mcpRequest.tool_name,
            arguments: mcpRequest.arguments
          }
        };
        
        console.log('Sending JSON-RPC request to MCP server:', JSON.stringify(rpcRequest, null, 2));
        
        mcpProcess.stdin.write(JSON.stringify(rpcRequest) + '\n');
        mcpProcess.stdin.end();
        
        // Process the result
        if (mcpResult.isError) {
          console.error('\n❌ MCP CALL FAILED');
          console.error('Error message:', mcpResult.content[0].text);
        } else {
          console.log('\n✅ MCP CALL SUCCEEDED');
          const resultJson = JSON.parse(mcpResult.content[0].text);
          console.log('MCP JWT token first 50 chars:', resultJson.capture_context.substring(0, 50) + '...');
        }
        
        // Summary
        console.log('\n' + '='.repeat(80));
        console.log('COMPARISON SUMMARY');
        console.log('='.repeat(80));
        console.log('Direct API Call: SUCCESS');
        console.log('MCP Call:', mcpResult && !mcpResult.isError ? 'SUCCESS' : 'FAILURE');
        
        if (directResult && mcpResult && !mcpResult.isError) {
          console.log('\nBoth calls succeeded using the complete request format!');
          console.log('Solution: Use the complete request format with all fields for reliable API calls.');
        } else {
          console.log('\nThe direct call succeeded but the MCP call failed.');
          console.log('This suggests there\'s an issue with how the MCP server processes or transforms the request.');
        }
      } catch (mcpError) {
        console.error('\n❌ MCP Error:', mcpError);
      }
    } catch (directError) {
      console.error('\n❌ Direct API Error:', directError);
    }
  } catch (error) {
    console.error('\n❌ ERROR during testing:');
    console.error(error);
  }
}

/**
 * Create the complete request configuration from the working debug-target-origins.js script
 */
function createCompleteRequest() {
  const requestObj = new cybersourceRestApi.GenerateUnifiedCheckoutCaptureContextRequest();
  
  // Complete fields that worked in debug-target-origins.js
  requestObj.targetOrigins = ['https://localhost:8081'];
  requestObj.clientVersion = '0.23';
  requestObj.allowedCardNetworks = ['VISA', 'MASTERCARD', 'AMEX'];
  requestObj.allowedPaymentTypes = ['CLICKTOPAY', 'PANENTRY', 'GOOGLEPAY'];
  requestObj.country = 'US';
  requestObj.locale = 'en_US';
  
  // Capture mandate
  requestObj.captureMandate = {
    billingType: 'FULL',
    requestEmail: true,
    requestPhone: true,
    requestShipping: true,
    shipToCountries: ['US', 'GB'],
    showAcceptedNetworkIcons: true
  };
  
  // Add complete order information
  const orderInformation = new cybersourceRestApi.Upv1capturecontextsOrderInformation();
  const amountDetails = new cybersourceRestApi.Upv1capturecontextsOrderInformationAmountDetails();
  
  amountDetails.totalAmount = '21.00';
  amountDetails.currency = 'USD';
  
  orderInformation.amountDetails = amountDetails;
  
  // Set billing information
  const billTo = new cybersourceRestApi.Upv1capturecontextsOrderInformationBillTo();
  billTo.address1 = '1111 Park Street';
  billTo.address2 = 'Apartment 24B';
  billTo.administrativeArea = 'NY';
  billTo.buildingNumber = '3';
  billTo.country = 'US';
  billTo.district = 'district';
  billTo.locality = 'New York';
  billTo.postalCode = '00000';
  billTo.email = 'maya.tran@company.com';
  billTo.firstName = 'Maya';
  billTo.lastName = 'Tran';
  billTo.middleName = 'S';
  billTo.title = 'Ms';
  billTo.phoneNumber = '1234567890';
  billTo.phoneType = 'phoneType';
  
  // Set company information
  const company = new cybersourceRestApi.Upv1capturecontextsOrderInformationBillToCompany();
  company.name = 'Visa Inc';
  company.address1 = '900 Metro Center Blvd';
  company.administrativeArea = 'CA';
  company.buildingNumber = '1';
  company.country = 'US';
  company.district = 'district';
  company.locality = 'Foster City';
  company.postalCode = '94404';
  
  billTo.company = company;
  orderInformation.billTo = billTo;
  
  // Set shipping information
  const shipTo = new cybersourceRestApi.Upv1capturecontextsOrderInformationShipTo();
  shipTo.address1 = 'Visa';
  shipTo.address2 = '123 Main Street';
  shipTo.address3 = 'Apartment 102';
  shipTo.administrativeArea = 'CA';
  shipTo.buildingNumber = 'string';
  shipTo.country = 'US';
  shipTo.locality = 'Springfield';
  shipTo.postalCode = '99999';
  shipTo.firstName = 'Joe';
  shipTo.lastName = 'Soap';
  
  orderInformation.shipTo = shipTo;
  requestObj.orderInformation = orderInformation;
  
  return requestObj;
}

// Run the test
replicateSuccess().catch(console.error);