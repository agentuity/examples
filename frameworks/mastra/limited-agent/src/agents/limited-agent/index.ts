import type { AgentContext, AgentRequest, AgentResponse } from '@agentuity/sdk';
import { Agent as MastraAgent } from '@mastra/core/agent';
import { openai } from '@ai-sdk/openai';
import { TokenLimiterProcessor } from '@mastra/core/processors';

const limited_agent = new MastraAgent({
  name: 'limited-agent',
  instructions: 'You are a helpful assistant that demonstrates the TokenLimiterProcessor guardrail.',
  model: openai('gpt-4o-mini'),
  outputProcessors: [
    new TokenLimiterProcessor({
      limit: 1000,
      strategy: "truncate",
      countMode: "cumulative"
    })
  ],
});

export const welcome = () => {
  return {
    welcome: 'Welcome to the Limited Agent Agent! I demonstrate how to use Mastra\'s TokenLimiterProcessor to limit the number of tokens in agent responses to control output length.',
    prompts: [
      {
        data: 'Why is token limiting important in AI applications?',
        contentType: 'text/plain',
      },
      {
        data: 'How does token counting work?',
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
    ctx.logger.info('Processing limited-agent request: %s', userMessage);

    const result = await limited_agent.generate(userMessage);

    return resp.text(result.text);
  } catch (error) {
    ctx.logger.error('Error in limited-agent:', error);
    return resp.text('Sorry, there was an error processing your request.');
  }
}
