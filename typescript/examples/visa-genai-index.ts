import axios from 'axios';
import { URL } from 'url';
import https from 'https';

(async () => {
  // These environment variables replicate the Python code's usage.
  // Note that for a real production environment, you would typically set these outside of code.
  process.env.REQUESTS_CA_BUNDLE = 'c:/Users/jbrans/repos/test/cacerts.pem';
  process.env.no_proxy = '.visa.com';

  const Hostname = 'https://genai-api.visa.com';

  // Equivalent to the Python data = {'username': 'jbrans', 'password': 'cLzb0fw7aCX-x[?'}
  const data = {
    username: '',
    password: ''
  };

  // Equivalent to the Python headers = {'Content-Type': 'application/json', 'Accept': 'application/json'}
  let headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };

  try {
    // Equivalent to requests.post(...) for login
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});
const response = await axios.post(
      `${Hostname}/genai-api/v1/auth/login`,
      data,
      { headers, httpsAgent }
    );

    // Display request information (Python code used requests.utils.urlparse)
    console.log('Request URL:', response.config.url);
    if (response.config.url) {
      const parsedUrl = new URL(response.config.url);
      console.log('Request Hostname:', parsedUrl.hostname);
    }

    // Show the JSON response and extract the access token
    console.log(response.data);
    const ACCESS_TOKEN = response.data['access_token'];
    const CHAT_MODEL_NAME = 'claude-3-7-sonnet-20250219';

    // Update headers to include Authorization
    headers = {
      ...headers,
      Authorization: `Bearer ${ACCESS_TOKEN}`
    };

    // Validate token
await axios.get(`${Hostname}/genai-api/v1/auth/validate`, { headers, httpsAgent });

    // Get list of applications
await axios.get(`${Hostname}/genai-api/v1/applications/`, { headers, httpsAgent });

    // Query chat endpoint #1
    let chatData: Record<string, any> = {
      model_name: CHAT_MODEL_NAME,
      application_name: 'HACKATHON',
      query: [
        { role: 'system', content: 'You are a AI chat bot.' },
        { role: 'user', content: 'say something about US constitution' }
      ]
    };
let chatResponse = await axios.post(
      `${Hostname}/genai-api/v1/queries/chat`,
      chatData,
      { headers, httpsAgent }
    );
    console.log('Chat Endpoint #1 response:', chatResponse.data);

    // Query chat endpoint #2 with "tools" and "tool_choice"
    chatData = {
      model_name: CHAT_MODEL_NAME,
      query: [
        {
          role: 'system',
          content: 'You are a helpful customer support assistant. Use the supplied tools to assist the user.'
        },
        {
          role: 'user',
          content: 'Hi, can you tell me the delivery date for my order?'
        }
      ],
      tools: [
        {
          type: 'function',
          function: {
            name: 'get_delivery_date',
            description: 'Get the delivery date for a customer\'s order. Call this whenever you need to know the delivery date, for example when a customer asks "Where is my package"',
            parameters: {
              type: 'object',
              properties: {
                order_id: {
                  type: 'string',
                  description: 'The customer\'s order ID.'
                }
              },
              required: ['order_id'],
              additionalProperties: false
            }
          }
        }
      ],
      tool_choice: {
        type: 'function',
        function: {
          name: 'get_delivery_date'
        }
      }
    };

chatResponse = await axios.post(
      `${Hostname}/genai-api/v1/queries/chat`,
      chatData,
      { headers, httpsAgent }
    );
    console.log('Chat Endpoint #2 (with tools) response:', chatResponse.data);

  } catch (error) {
    console.error('Error:', error);
  }
})();
