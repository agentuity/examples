import type { AgentContext, AgentRequest, AgentResponse } from '@agentuity/sdk';
import { Agent as MastraAgent } from '@mastra/core/agent';
import { openai } from '@ai-sdk/openai';
import { ModerationProcessor } from '@mastra/core/processors';

const moderatedAgent = new MastraAgent({
  name: 'moderated-agent',
  instructions: 'You are a helpful assistant that provides information while maintaining a safe and respectful conversation.',
  model: openai('gpt-4o-mini'),
  inputProcessors: [
    new ModerationProcessor({
      model: openai('gpt-4o-mini'),
      threshold: 0.7,
      strategy: 'block',
      categories: ['hate', 'harassment', 'violence'],
      instructions: 'Detect and block inappropriate content including hate speech, harassment, and violence.'
    })
  ],
  outputProcessors: [
    new ModerationProcessor({
      model: openai('gpt-4o-mini'),
      threshold: 0.7,
      strategy: 'block',
      categories: ['hate', 'harassment', 'violence'],
      instructions: 'Ensure responses are safe and appropriate.'
    })
  ]
});

export const welcome = () => {
  return {
    welcome: 'Welcome to the Moderated Agent! I demonstrate how to use Mastra\'s ModerationProcessor to filter harmful content in both user input and AI responses.',
    prompts: [
      {
        data: 'What are the benefits of using content moderation in AI applications?',
        contentType: 'text/plain',
      },
      {
        data: 'How does content filtering work?',
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
    const userMessage = await req.data.text();
    ctx.logger.info('Processing moderated request: %s', userMessage);

    const result = await moderatedAgent.generate(userMessage);

    return resp.text(result.text);
  } catch (error) {
    ctx.logger.error('Error in moderated agent:', error);

    if (error instanceof Error && error.message.includes('blocked')) {
      return resp.text('Your message was blocked due to content moderation policies. Please try a different query.');
    }

    return resp.text('Sorry, there was an error processing your request.');
  }
}
