import type { AgentContext, AgentRequest, AgentResponse } from '@agentuity/sdk';
import { openai } from '@ai-sdk/openai';
import { Agent as MastraAgent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { LibSQLStore } from '@mastra/libsql';

const memoryAgent = new MastraAgent({
  name: 'memory-agent',
  instructions: 'You are a helpful assistant with memory. Remember user preferences and past conversations.',
  model: openai('gpt-4o-mini'),
  memory: new Memory({
    storage: new LibSQLStore({
      url: 'file:./memory-agent.db',
    }),
  }),
});

export const welcome = () => {
  return {
    welcome:
      'Welcome to the Mastra Memory Agent! I can remember information from our conversations. Try telling me your favorite color or asking me to recall it later.',
    prompts: [
      {
        data: 'Remember my favorite color is blue.',
        contentType: 'text/plain',
      },
      {
        data: "What's my favorite color?",
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
    const userInput = await req.data.text();
    
    const threadId = 'user-123';
    const resourceId = 'test-123';

    ctx.logger.info('Processing request with memory for thread: %s, resource: %s', threadId, resourceId);

    const response = await memoryAgent.generate(userInput, {
      memory: {
        thread: threadId,
        resource: resourceId,
      },
    });

    return resp.text(response.text);
  } catch (error) {
    ctx.logger.error('Error running agent:', error);

    return resp.text('Sorry, there was an error processing your request.');
  }
}
