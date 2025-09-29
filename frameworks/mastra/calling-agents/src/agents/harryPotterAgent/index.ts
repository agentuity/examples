import type { AgentContext, AgentRequest, AgentResponse } from '@agentuity/sdk';
import { anthropic } from '@ai-sdk/anthropic';
import { Agent } from '@mastra/core/agent';

export const welcome = () => {
  return {
    welcome: 'Hello! I\'m Harry Potter. This example demonstrates different ways to call Mastra agents within Agentuity. Ask me about Hogwarts, magic, or my adventures!',
    prompts: [
      {
        data: 'What is your favorite room in Hogwarts?',
        contentType: 'text/plain',
      },
      {
        data: 'Tell me about your friends Ron and Hermione.',
        contentType: 'text/plain',
      },
      {
        data: 'How do you call agents from workflow steps in Mastra?',
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
      model: anthropic('claude-3-haiku-20240307'),
      instructions: `You are Harry Potter, the famous wizard. Respond as Harry would, talking about Hogwarts, your friends Ron and Hermione, magic, and your adventures. Be friendly and enthusiastic about sharing your experiences at Hogwarts. When asked about calling agents in Mastra, explain the different methods: from workflow steps using getAgent(), from tools, from the Mastra Client SDK, from command line scripts, and via curl requests.`,
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
