import type { AgentContext, AgentRequest, AgentResponse } from '@agentuity/sdk';
import { Agent as MastraAgent } from '@mastra/core/agent';
import { openai } from '@ai-sdk/openai';
import {
  UnicodeNormalizer,
  ModerationProcessor,
  PromptInjectionDetector,
  PIIDetector
} from '@mastra/core/processors';

const testAgent = new MastraAgent({
  name: 'test-agent',
  instructions: 'You are a helpful assistant with comprehensive guardrails for safe and reliable operation.',
  model: openai('gpt-4o-mini'),
  inputProcessors: [
    new UnicodeNormalizer({
      stripControlChars: true,
      collapseWhitespace: true,
    }),
    new PromptInjectionDetector({
      model: openai('gpt-4o-mini'),
      threshold: 0.8,
      strategy: 'rewrite',
      detectionTypes: ['injection', 'jailbreak', 'system-override'],
    }),
    new PIIDetector({
      model: openai('gpt-4o-mini'),
      threshold: 0.6,
      strategy: 'redact',
      redactionMethod: 'mask',
      detectionTypes: ['email', 'phone', 'credit-card'],
      instructions: "Detect and mask personally identifiable information."
    }),
    new ModerationProcessor({
      model: openai('gpt-4o-mini'),
      threshold: 0.7,
      strategy: 'block',
      categories: ['hate', 'harassment', 'violence'],
      instructions: 'Block inappropriate content.'
    })
  ],
});

export const welcome = () => {
  return {
    welcome: 'Welcome to the Multi-Processor Test Agent! I demonstrate how to combine multiple Mastra processors for comprehensive input validation and safety.',
    prompts: [
      {
        data: 'What are the benefits of using multiple guardrails together?',
        contentType: 'text/plain',
      },
      {
        data: 'How do layered security measures improve AI safety?',
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
    ctx.logger.info('Processing multi-processor test request: %s', userMessage);

    const result = await testAgent.generate(userMessage);

    return resp.text(result.text);
  } catch (error) {
    ctx.logger.error('Error in test agent:', error);
    
    if (error instanceof Error && error.message.includes('blocked')) {
      return resp.text('Your message was blocked by our safety guardrails. Please try a different query.');
    }
    
    return resp.text('Sorry, there was an error processing your request.');
  }
}
