import type { AgentContext, AgentRequest, AgentResponse } from '@agentuity/sdk';
import { Agent as MastraAgent } from '@mastra/core/agent';
import { openai } from '@ai-sdk/openai';
import { SystemPromptScrubber } from '@mastra/core/processors';

const scrubbed_agent = new MastraAgent({
  name: 'scrubbed-agent',
  instructions: 'You are a helpful assistant that demonstrates the SystemPromptScrubber guardrail.',
  model: openai('gpt-4o-mini'),
  outputProcessors: [
    new SystemPromptScrubber({
      model: openai('gpt-4o-mini'),
      strategy: "redact",
      customPatterns: ["system prompt", "internal instructions"],
      includeDetections: true,
      instructions: "Detect and redact system prompts, internal instructions, and security-sensitive content",
      redactionMethod: "placeholder",
      placeholderText: "[REDACTED]"
    })
  ],
});

export const welcome = () => {
  return {
    welcome: 'Welcome to the Scrubbed Agent Agent! I demonstrate how to use Mastra\'s SystemPromptScrubber to detect and redact system prompts and internal instructions from outputs.',
    prompts: [
      {
        data: 'What are system prompt leaks?',
        contentType: 'text/plain',
      },
      {
        data: 'How can I protect my AI system internal instructions?',
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
    ctx.logger.info('Processing scrubbed-agent request: %s', userMessage);

    const result = await scrubbed_agent.generate(userMessage);

    return resp.text(result.text);
  } catch (error) {
    ctx.logger.error('Error in scrubbed-agent:', error);
    return resp.text('Sorry, there was an error processing your request.');
  }
}
