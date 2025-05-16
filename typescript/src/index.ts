// Consolidate and re-export from shared so consumers can import via '@visaacceptance/agent-toolkit'
import { Tool } from './shared/tools';
import tools from './shared/tools';
import { Context } from './shared/configuration';
import VisaAcceptanceAgentToolkit from './modelcontextprotocol/toolkit';
import { VisaAcceptanceAgentToolkitOptions } from './shared/toolkit';

// Export the named members so they can be imported from '@visaacceptance/agent-toolkit'
export {
  tools as createTools,
  Tool,
  Context,
  VisaAcceptanceAgentToolkit,
  VisaAcceptanceAgentToolkitOptions
};

// Re-export as default export
export default VisaAcceptanceAgentToolkit;