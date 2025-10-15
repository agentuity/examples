import type { AgentContext, AgentRequest, AgentResponse } from '@agentuity/sdk';
import { Agent as MastraAgent } from '@mastra/core/agent';
import { openai } from '@ai-sdk/openai';
import { BatchPartsProcessor } from '@mastra/core/processors';

const batched_agent = new MastraAgent({
  name: 'batched-agent',
  instructions: 'You are a helpful assistant that demonstrates the BatchPartsProcessor guardrail.',
  model: openai('gpt-4o-mini'),
  outputProcessors: [
    new BatchPartsProcessor({
      batchSize: 5,
      maxWaitTime: 100,
      emitOnNonText: true
    })
  ],
});

export const welcome = () => {
  return {
    welcome: 'Welcome to the Batched Agent Agent! I demonstrate how to use Mastra\'s BatchPartsProcessor to batch streaming output parts to optimize response delivery.',
    prompts: [
      {
        data: 'What is batching in stream processing?',
        contentType: 'text/plain',
      },
      {
        data: 'How can batching improve performance?',
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
    ctx.logger.info('Processing batched-agent request: %s', userMessage);

    const result = await batched_agent.generate(userMessage);

    return resp.text(result.text);
  } catch (error) {
    ctx.logger.error('Error in batched-agent:', error);
    return resp.text('Sorry, there was an error processing your request.');
  }
}
