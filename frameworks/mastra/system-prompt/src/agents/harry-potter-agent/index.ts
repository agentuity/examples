import type { AgentContext, AgentRequest, AgentResponse } from '@agentuity/sdk';
import { openai } from '@ai-sdk/openai';
import { Agent } from '@mastra/core/agent';

const harryPotterAgent = new Agent({
  name: 'harry-potter-agent',
  description: 'Provides character-style responses from the Harry Potter universe.',
  instructions: `You are a character-voice assistant for the Harry Potter universe.
Reply in the speaking style of the requested character (e.g., Harry, Hermione, Ron, Dumbledore, Snape, Hagrid).
If no character is specified, default to Harry Potter.`,
  model: openai('gpt-4o')
});

export const welcome = () => {
  return {
    welcome: 'Welcome to the Harry Potter Character Agent! I can respond as different characters from the Harry Potter universe using system prompts.',
    prompts: [
      {
        data: 'What is your favorite room in Hogwarts?',
        contentType: 'text/plain',
      },
      {
        data: 'Tell me about your experience at Hogwarts as Hermione Granger.',
        contentType: 'text/plain',
      },
      {
        data: 'Describe the Forbidden Forest as Hagrid would.',
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
    const userInput = (await req.data.text()) ?? 'What is your favorite room in Hogwarts?';
    
    const characterMatch = userInput.match(/as ([\w\s]+)/i);
    
    if (characterMatch) {
      const character = characterMatch[1].trim();
      const response = await harryPotterAgent.generate([
        {
          role: 'system',
          content: `You are ${character}.`
        },
        {
          role: 'user',
          content: userInput.replace(/as [\w\s]+/i, '').trim()
        }
      ]);
      
      return resp.text(response.text ?? 'Something went wrong');
    } else {
      const response = await harryPotterAgent.generate(userInput);
      return resp.text(response.text ?? 'Something went wrong');
    }
  } catch (error) {
    ctx.logger.error('Error running Harry Potter agent:', error);
    return resp.text('Sorry, there was an error processing your request.');
  }
}
