import VisaAcceptanceAgentToolkit from './toolkit';
import VisaAcceptanceTool from './tool';

// Export the toolkit and tool creator
export {
  VisaAcceptanceAgentToolkit,
  VisaAcceptanceTool
};

// Export a default instance of the toolkit for ease of use
export default new VisaAcceptanceAgentToolkit(
  process.env.VISA_ACCEPTANCE_SECRET_KEY,
  process.env.VISA_ACCEPTANCE_MERCHANT_ID,
  process.env.VISA_ACCEPTANCE_API_KEY_ID
);