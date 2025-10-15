import type { AgentContext, AgentRequest, AgentResponse } from '@agentuity/sdk';
import { openai } from '@ai-sdk/openai';
import { Agent as MastraAgent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { LibSQLStore } from '@mastra/libsql';

export type UserTier = 'enterprise' | 'pro';

const premiumMemory = new Memory({
  storage: new LibSQLStore({
    url: 'file:./premium-memory.db',
  }),
});

const standardMemory = new Memory({
  storage: new LibSQLStore({
    url: 'file:./standard-memory.db',
  }),
});

const dynamicMemoryAgent = new MastraAgent({
  name: 'dynamic-memory-agent',
  instructions: 'You are a helpful assistant with dynamic memory based on user tier. Enterprise users get premium memory, others get standard memory.',
  model: openai('gpt-4o-mini'),
  memory: ({ runtimeContext }) => {
    const userTier = runtimeContext.get('user-tier') as UserTier | undefined;
    
    return userTier === 'enterprise' ? premiumMemory : standardMemory;
  },
});

export const welcome = () => {
  return {
    welcome:
      'Welcome to the Mastra Dynamic Memory Agent! I demonstrate how memory can be dynamically selected based on user tier. Enterprise users get premium memory storage, while pro users get standard storage.',
    prompts: [
      {
        data: 'Tell me something about enterprise features.',
        contentType: 'text/plain',
      },
      {
        data: 'What tier am I using?',
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
    const userTier: UserTier = 'enterprise';

    ctx.logger.info('Processing request with dynamic memory for tier: %s', userTier);

    const response = await dynamicMemoryAgent.generate(userInput, {
      memory: {
        thread: threadId,
        resource: resourceId,
      },
      runtimeContext: {
        ['user-tier']: userTier,
      } as any,
    });

    return resp.text(response.text);
  } catch (error) {
    ctx.logger.error('Error running agent:', error);

    return resp.text('Sorry, there was an error processing your request.');
  }
}
