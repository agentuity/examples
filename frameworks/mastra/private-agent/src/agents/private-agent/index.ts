import type { AgentContext, AgentRequest, AgentResponse } from '@agentuity/sdk';
import { Agent as MastraAgent } from '@mastra/core/agent';
import { openai } from '@ai-sdk/openai';
import { PIIDetector } from '@mastra/core/processors';

const private_agent = new MastraAgent({
  name: 'private-agent',
  instructions: 'You are a helpful assistant that demonstrates the PIIDetector guardrail.',
  model: openai('gpt-4o-mini'),
  inputProcessors: [
    new PIIDetector({
      model: openai('gpt-4o-mini'),
      threshold: 0.6,
      strategy: 'redact',
      redactionMethod: 'mask',
      detectionTypes: ['email', 'phone', 'credit-card'],
      instructions: "Detect and mask personally identifiable information."
    })
  ],
});

export const welcome = () => {
  return {
    welcome: 'Welcome to the Private Agent Agent! I demonstrate how to use Mastra\'s PIIDetector to detect and mask personally identifiable information like emails, phone numbers, and credit cards.',
    prompts: [
      {
        data: 'What is PII and why should it be protected?',
        contentType: 'text/plain',
      },
      {
        data: 'How does PII detection work?',
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
    ctx.logger.info('Processing private-agent request: %s', userMessage);

    const result = await private_agent.generate(userMessage);

    return resp.text(result.text);
  } catch (error) {
    ctx.logger.error('Error in private-agent:', error);
    return resp.text('Sorry, there was an error processing your request.');
  }
}
