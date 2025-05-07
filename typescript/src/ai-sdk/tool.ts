import type {CoreTool} from 'ai';
import {tool} from 'ai';
import {z} from 'zod';
import VisaAcceptanceAPI from '../shared/api';



export default function VisaAcceptanceTool(
    visaAcceptanceAPI: VisaAcceptanceAPI,
    method: string,
    description: string,
    schema: z.ZodObject<any, any, any, any, {[x: string]: any}>
  ): CoreTool {
    return tool({
      description: description,
      parameters: schema,
      execute: async (arg: z.output<typeof schema>) => {
        // Use type assertion to ensure TypeScript recognizes the run method
        return (visaAcceptanceAPI as any).run(method, arg);
      },
    });
  }