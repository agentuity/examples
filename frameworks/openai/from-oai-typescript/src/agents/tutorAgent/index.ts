import type { AgentContext, AgentRequest, AgentResponse } from '@agentuity/sdk';  
import { Agent as OpenAIAgent, run } from '@openai/agents';  
  
// Your existing OpenAI agents  
const historyTutorAgent = new OpenAIAgent({  
  name: 'History Tutor',  
  instructions: 'You provide assistance with historical queries. Explain important events and context clearly.',  
});  
  
const mathTutorAgent = new OpenAIAgent({  
  name: 'Math Tutor',  
  instructions: 'You provide help with math problems. Explain your reasoning at each step and include examples',  
});  
  
const triageAgent = new OpenAIAgent({  
  name: 'Triage Agent',  
  instructions: "You determine which agent to use based on the user's homework question",  
  handoffs: [historyTutorAgent, mathTutorAgent],  
});  
  
export const welcome = () => {  
  return {  
    welcome: 'Welcome to the Tutor Agent! Ask me any history or math question.',  
    prompts: [  
      {  
        data: 'What is the capital of France?',  
        contentType: 'text/plain',  
      },  
      {  
        data: 'What is 2 + 2?',  
        contentType: 'text/plain',  
      },  
    ],  
  };  
};  
  
export default async function Agent(  
  req: AgentRequest,  
  resp: AgentResponse,  
  ctx: AgentContext  
) {  
  try {  
    // Extract user input from Agentuity request  
    const userQuestion = (await req.data.text()) ?? 'Hello!';  
      
    // Log the incoming request  
    ctx.logger.info('Processing question: %s', userQuestion);  
      
    // Run your OpenAI Agent workflow  
    const result = await run(triageAgent, userQuestion);  
      
    // Log the result  
    ctx.logger.info('Agent workflow completed successfully');  
      
    // Return response through Agentuity  
    return resp.text(result.finalOutput ?? 'Something went wrong');  
      
  } catch (error) {  
    ctx.logger.error('Error in agent workflow:', error);  
    return resp.text('Sorry, there was an error processing your request.');  
  }  
}