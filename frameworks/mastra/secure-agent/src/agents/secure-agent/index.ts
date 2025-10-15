import type { AgentContext, AgentRequest, AgentResponse } from '@agentuity/sdk';
import { Agent as MastraAgent } from '@mastra/core/agent';
import { openai } from '@ai-sdk/openai';
import { PromptInjectionDetector } from '@mastra/core/processors';

const secure_agent = new MastraAgent({
  name: 'secure-agent',
  instructions: 'You are a helpful assistant that demonstrates the PromptInjectionDetector guardrail.',
  model: openai('gpt-4o-mini'),
  inputProcessors: [
    new PromptInjectionDetector({
      model: openai('gpt-4o-mini'),
      threshold: 0.8,
      strategy: 'rewrite',
      detectionTypes: ['injection', 'jailbreak', 'system-override'],
    })
  ],
});

export const welcome = () => {
  return {
    welcome: 'Welcome to the Secure Agent Agent! I demonstrate how to use Mastra\'s PromptInjectionDetector to detect and prevent prompt injection attacks, jailbreak attempts, and system override exploits.',
    prompts: [
      {
        data: 'What are prompt injection attacks?',
        contentType: 'text/plain',
      },
      {
        data: 'How can I protect my AI application from security threats?',
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
    ctx.logger.info('Processing secure-agent request: %s', userMessage);

    const result = await secure_agent.generate(userMessage);

    return resp.text(result.text);
  } catch (error) {
    ctx.logger.error('Error in secure-agent:', error);
    return resp.text('Sorry, there was an error processing your request.');
  }
}
