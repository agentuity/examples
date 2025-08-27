import type { AgentContext, AgentRequest, AgentResponse } from '@agentuity/sdk';
import { openai } from '@ai-sdk/openai';
import { Agent } from '@mastra/core/agent';

export const welcome = () => {
  return {
    welcome:
      'This is the Mastra System Prompt example wrapped for Agentuity. Try changing the character voice via the input.',
    prompts: [
      { data: 'Speak like Harry Potter about friendship.', contentType: 'text/plain' },
      { data: 'Speak like Hermione about studying.', contentType: 'text/plain' }
    ]
  };
};

export default async function Agent(
  req: AgentRequest,
  resp: AgentResponse,
  ctx: AgentContext
) {
  try {
    const defaultInstructions =
      'You are a friendly assistant. Respond clearly and helpfully.';

    const agent = new Agent({
      name: 'MastraSystemPrompt',
      model: openai('gpt-4o-mini'),
      instructions: defaultInstructions
    });

    const userText = (await req.data.text()) || 'Hello there!';
    const systemMessage = ''; // callers can pass style in text; Mastra example shows swapping system at call

    const result = await agent.generate(
      userText,
      systemMessage ? { system: systemMessage } : undefined
    );

    return resp.text(result.text || '');
  } catch (error) {
    ctx.logger.error(
      'Mastra system-prompt agent error: %s',
      error instanceof Error ? error.message : String(error)
    );
    return resp.text('Sorry, there was an error processing your request.');
  }
}
