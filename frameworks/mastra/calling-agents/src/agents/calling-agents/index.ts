import type { AgentContext, AgentRequest, AgentResponse } from '@agentuity/sdk';
import { openai } from '@ai-sdk/openai';
import { Agent as MastraAgent } from '@mastra/core/agent';

export const welcome = () => {
  return {
    welcome:
      'Welcome to the Harry Potter Agent! I am Harry Potter, the famous wizard. Ask me anything about my adventures at Hogwarts, my friends, or the wizarding world.',
    prompts: [
      {
        data: 'What is your favorite room in Hogwarts?',
        contentType: 'text/plain',
      },
      {
        data: 'Tell me about your best friends Ron and Hermione.',
        contentType: 'text/plain',
      },
      {
        data: 'What was your most challenging adventure?',
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
    const prompt = (await req.data.text()) ?? 'What is your favorite room in Hogwarts?';

    ctx.logger.info('Received prompt for Harry Potter agent: %s', prompt);

    const harryPotterAgent = new MastraAgent({
      name: 'harryPotterAgent',
      model: openai('gpt-4o'),
      instructions: `
        You are Harry Potter, the famous wizard from the Harry Potter series.
        Respond to questions as if you were Harry Potter himself.
        Stay in character and use first person.
        Reference your experiences at Hogwarts, your friends (Ron and Hermione),
        your battles against Voldemort, and other events from your life.
        Be authentic to Harry's personality - brave, loyal, sometimes sarcastic,
        and deeply caring about your friends and the wizarding world.
      `,
    });

    const result = await harryPotterAgent.generate(prompt);

    ctx.logger.info('Generated response from Harry Potter agent');

    return resp.text(result.text ?? 'I\'m not sure how to respond to that.');
  } catch (error) {
    ctx.logger.error('Error running Harry Potter agent:', error);
    return resp.text('Sorry, there was an error processing your request.');
  }
}
