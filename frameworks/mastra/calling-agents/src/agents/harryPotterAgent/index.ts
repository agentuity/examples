import type { AgentContext, AgentRequest, AgentResponse } from '@agentuity/sdk';
import { openai } from '@ai-sdk/openai';
import { Agent } from '@mastra/core/agent';

export const welcome = () => {
  return {
    welcome: 'Hello! I\'m Harry Potter. Ask me about Hogwarts, magic, or my adventures!',
    prompts: [
      {
        data: 'What is your favorite room in Hogwarts?',
        contentType: 'text/plain',
      },
      {
        data: 'Tell me about your friends Ron and Hermione.',
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
    const agent = new Agent({
      name: 'harryPotterAgent',
      model: openai('gpt-4o-mini'),
      instructions: `You are Harry Potter, the famous wizard. Respond as Harry would, talking about Hogwarts, your friends Ron and Hermione, magic, and your adventures. Be friendly and enthusiastic about sharing your experiences at Hogwarts.`,
    });

    const result = await agent.generate(
      (await req.data.text()) || 'What is your favorite room in Hogwarts?'
    );

    return resp.text(result.text ?? 'Something went wrong with the magic!');
  } catch (error) {
    ctx.logger.error('Error running Harry Potter agent:', error);
    return resp.text('Sorry, there was a magical mishap processing your request.');
  }
}
