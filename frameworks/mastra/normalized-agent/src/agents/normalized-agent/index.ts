import type { AgentContext, AgentRequest, AgentResponse } from '@agentuity/sdk';
import { Agent as MastraAgent } from '@mastra/core/agent';
import { openai } from '@ai-sdk/openai';
import { UnicodeNormalizer } from '@mastra/core/processors';

const normalized_agent = new MastraAgent({
  name: 'normalized-agent',
  instructions: 'You are a helpful assistant that demonstrates the UnicodeNormalizer guardrail.',
  model: openai('gpt-4o-mini'),
  inputProcessors: [
    new UnicodeNormalizer({
      stripControlChars: true,
      collapseWhitespace: true,
    })
  ],
});

export const welcome = () => {
  return {
    welcome: 'Welcome to the Normalized Agent Agent! I demonstrate how to use Mastra\'s UnicodeNormalizer to clean and standardize user input by removing control characters and collapsing whitespace.',
    prompts: [
      {
        data: 'What is the purpose of text normalization in NLP?',
        contentType: 'text/plain',
      },
      {
        data: 'How does unicode normalization improve data quality?',
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
    ctx.logger.info('Processing normalized-agent request: %s', userMessage);

    const result = await normalized_agent.generate(userMessage);

    return resp.text(result.text);
  } catch (error) {
    ctx.logger.error('Error in normalized-agent:', error);
    return resp.text('Sorry, there was an error processing your request.');
  }
}
