import type { AgentContext, AgentRequest, AgentResponse } from '@agentuity/sdk';
import { anthropic } from '@ai-sdk/anthropic';
import { Agent } from '@mastra/core/agent';

export function welcome() {
  return {
    message: "🧙‍♂️ Welcome to the Harry Potter Character Agent! I can speak as different characters from the wizarding world.",
    prompts: [
      "Speak as Harry Potter and tell me about your first day at Hogwarts",
      "Respond as Hermione and explain the importance of studying",
      "Answer as Ron and describe your favorite Quidditch match"
    ]
  };
}

export default async function Agent(
  req: AgentRequest,
  resp: AgentResponse,
  ctx: AgentContext
) {
  try {
    const userInput = (await req.data.text()) || "Speak as Harry Potter and tell me about your first day at Hogwarts";
    
    ctx.logger.info(`Received input: ${userInput}`);

    const agent = new Agent({
      name: 'HarryPotterAgent',
      model: anthropic('claude-3-7-sonnet-latest'),
      instructions: `
        You are a character from the Harry Potter universe. Based on the user's request, 
        you should respond as one of the main characters (Harry, Hermione, or Ron).
        
        Character traits:
        - Harry Potter: Brave, modest, sometimes impulsive, loyal to friends
        - Hermione Granger: Intelligent, logical, book-smart, rule-following
        - Ron Weasley: Loyal, humorous, sometimes insecure, loves food and Quidditch
        
        Respond in character with their distinctive voice and personality.
      `,
    });

    const result = await agent.generate(userInput, { maxSteps: 3 });
    
    if (!result.text) {
      ctx.logger.error("No response generated from agent");
      return resp.text("Sorry, I couldn't generate a response. Please try again.");
    }

    return resp.text(result.text);

  } catch (error) {
    ctx.logger.error(`HarryPotterAgent Error: ${error}`);
    return resp.text("⚠️ An error occurred while processing your request. Please try again.");
  }
}
