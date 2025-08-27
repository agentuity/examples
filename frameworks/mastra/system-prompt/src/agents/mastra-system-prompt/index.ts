import type { AgentContext, AgentRequest, AgentResponse } from '@agentuity/sdk';
import { openai } from '@ai-sdk/openai';
import { Agent } from '@mastra/core/agent';

export const welcome = () => {
  return {
    welcome:
      'Mastra System Prompt example wrapped for Agentuity. You can provide a system prompt at runtime.',
    prompts: [
      { data: 'system: You are Harry Potter.\nTalk about the value of friendship.', contentType: 'text/plain' },
      { data: 'system: You are Hermione Granger.\nShare study tips.', contentType: 'text/plain' }
    ]
  };
};

export default async function Agent(
  req: AgentRequest,
  resp: AgentResponse,
  ctx: AgentContext
) {
  try {
    const agent = new Agent({
      name: 'MastraSystemPrompt',
      model: openai('gpt-4o-mini'),
      instructions: 'You are a helpful assistant.'
    });

    const input = (await req.data.text()) || 'Hello there!';
    let system: string | undefined;
    let message = input;

    const match = /^system:\s*(.+)\n([\s\S]*)$/i.exec(input);
    if (match) {
      system = match[1].trim();
      message = (match[2] || '').trim() || 'Continue.';
    }

    const result = await agent.generate(message, system ? { system } : undefined);
    return resp.text(result.text || '');
  } catch (error) {
    ctx.logger.error(
      'Mastra system-prompt agent error: %s',
      error instanceof Error ? error.message : String(error)
    );
    return resp.text('Sorry, there was an error processing your request.');
  }
}
