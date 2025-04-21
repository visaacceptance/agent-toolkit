import CybersourceAgentToolkit from './toolkit';
import CybersourceTool from './tool';

// Export the toolkit and tool creator
export {
  CybersourceAgentToolkit,
  CybersourceTool
};

// Export a default instance of the toolkit for ease of use
export default new CybersourceAgentToolkit(
  process.env.CYBERSOURCE_SECRET_KEY,
  process.env.CYBERSOURCE_MERCHANT_ID,
  process.env.CYBERSOURCE_API_KEY_ID
);