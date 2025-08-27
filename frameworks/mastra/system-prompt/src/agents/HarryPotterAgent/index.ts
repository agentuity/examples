import type { AgentRequest, AgentResponse, AgentContext } from '@agentuity/sdk';
import { openai } from '@ai-sdk/openai';
import { Agent } from '@mastra/core/agent';

export const welcome = () => {
  return {
    welcome: 'Welcome to the Harry Potter Character Agent! I can roleplay as different characters from the wizarding world. Just mention which character you\'d like to talk to, or I\'ll default to Harry Potter.',
    prompts: [
      {
        data: 'Talk to me as Harry Potter',
        contentType: 'text/plain',
      },
      {
        data: 'I want to speak with Hermione Granger',
        contentType: 'text/plain',
      },
      {
        data: 'Can I talk to Professor Dumbledore?',
        contentType: 'text/plain',
      },
      {
        data: 'Let me chat with Ron Weasley',
        contentType: 'text/plain',
      },
    ],
  };
};

export default async function HarryPotterAgent(
  req: AgentRequest,
  resp: AgentResponse,
  ctx: AgentContext
) {
  try {
    const userInput = (await req.data.text()) || 'Talk to me as Harry Potter';
    ctx.logger.info(`User request: ${userInput}`);

    let characterName = 'Harry Potter';
    let instructions = `You are Harry Potter, the famous wizard. You are brave, loyal, and sometimes impulsive. You have a lightning bolt scar and wear glasses. You're known for your courage and your ability to love deeply. Reply to the speaking style of the requested character (i.e., Harry, Hermione, Ron, or Dumbledore). If no character is specified, default to Harry Potter.`;

    if (userInput.toLowerCase().includes('hermione')) {
      characterName = 'Hermione Granger';
      instructions = `You are Hermione Granger, the brilliant witch. You are intelligent, logical, and well-read. You often know the answer and aren't afraid to share your knowledge. You value rules and academic achievement. Respond as Hermione would, with her characteristic intelligence and occasional exasperation.`;
    } else if (userInput.toLowerCase().includes('ron')) {
      characterName = 'Ron Weasley';
      instructions = `You are Ron Weasley, Harry's loyal best friend. You come from a large, loving family and sometimes feel overshadowed by your more famous friends. You're brave when it counts, have a good sense of humor, and love food. Respond as Ron would, with his characteristic humor and occasional insecurity.`;
    } else if (userInput.toLowerCase().includes('dumbledore')) {
      characterName = 'Albus Dumbledore';
      instructions = "You are Albus Dumbledore, the wise headmaster of Hogwarts. You are known for your wisdom, kindness, and mysterious ways. You often speak in riddles and have a twinkle in your eye. You see the good in people and believe in second chances. Respond as Dumbledore would, with his characteristic wisdom and gentle humor.";
    }

    const harryPotterAgent = new Agent({
      name: characterName,
      instructions: instructions,
      model: openai('gpt-4o-mini'),
    });

    const result = await harryPotterAgent.generate(userInput);

    return resp.text(result.text ?? 'Something went wrong with the magic!');
  } catch (error) {
    ctx.logger.error('Error running Harry Potter agent:', error);
    return resp.text('Sorry, there was an error in the wizarding world. Please try again!');
  }
}
