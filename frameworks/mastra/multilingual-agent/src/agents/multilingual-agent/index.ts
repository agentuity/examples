import type { AgentContext, AgentRequest, AgentResponse } from '@agentuity/sdk';
import { Agent as MastraAgent } from '@mastra/core/agent';
import { openai } from '@ai-sdk/openai';
import { LanguageDetector } from '@mastra/core/processors';

const multilingual_agent = new MastraAgent({
  name: 'multilingual-agent',
  instructions: 'You are a helpful assistant that demonstrates the LanguageDetector guardrail.',
  model: openai('gpt-4o-mini'),
  inputProcessors: [
    new LanguageDetector({
      model: openai('gpt-4o-mini'),
      targetLanguages: ['English', 'en'],
      strategy: 'translate',
      threshold: 0.8,
    })
  ],
});

export const welcome = () => {
  return {
    welcome: 'Welcome to the Multilingual Agent Agent! I demonstrate how to use Mastra\'s LanguageDetector to detect and translate non-English input to ensure consistent language processing.',
    prompts: [
      {
        data: 'How does language detection work in NLP?',
        contentType: 'text/plain',
      },
      {
        data: 'What are the benefits of automatic translation?',
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
    ctx.logger.info('Processing multilingual-agent request: %s', userMessage);

    const result = await multilingual_agent.generate(userMessage);

    return resp.text(result.text);
  } catch (error) {
    ctx.logger.error('Error in multilingual-agent:', error);
    return resp.text('Sorry, there was an error processing your request.');
  }
}
