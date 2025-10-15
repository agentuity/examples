import type { AgentContext, AgentRequest, AgentResponse } from '@agentuity/sdk';
import { Agent as MastraAgent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { LibSQLStore } from '@mastra/libsql';
import { openai } from '@ai-sdk/openai';

const memory = new Memory({
  storage: new LibSQLStore({
    url: 'file:mastra-network.db',
  }),
});

const developerAgent = new MastraAgent({
  name: 'Developer',
  description: 'A developer that implements code and builds features. Use this to write code or implement functionality.',
  instructions: 'You are a developer that implements tasks. You write clean, efficient code.',
  model: openai('gpt-4o'),
});

const reviewerAgent = new MastraAgent({
  name: 'Reviewer',
  description: 'A code reviewer that reviews code quality and suggests improvements. Use this to review code.',
  instructions: 'You are a code reviewer that reviews code for quality, bugs, and best practices.',
  model: openai('gpt-4o'),
});

const projectManagerAgent = new MastraAgent({
  name: 'Project Manager Network',
  instructions: 'You are a project manager that coordinates developers and reviewers to build projects. Break down tasks and delegate to the appropriate specialists.',
  model: openai('gpt-4o'),
  agents: {
    developer: developerAgent,
    reviewer: reviewerAgent,
  },
  memory,
});

export const welcome = () => {
  return {
    welcome:
      'Welcome to the Mastra Agent Network! I coordinate three specialized agents (Project Manager, Developer, and Reviewer) to handle complex software development tasks. The network uses non-deterministic routing to process your request.',
    prompts: [
      {
        data: 'Build a todo app',
        contentType: 'text/plain',
      },
      {
        data: 'Create a REST API for user authentication',
        contentType: 'text/plain',
      },
      {
        data: 'Design a database schema for a blog platform',
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
    
    ctx.logger.info('Processing request with agent network: %s', userInput);

    const networkStream = await projectManagerAgent.network(userInput, {
      maxSteps: 10,
    });

    let fullText = '';
    for await (const chunk of networkStream) {
      if (chunk.type === 'text-delta') {
        fullText += chunk.payload.text;
      }
    }

    const status = await networkStream.status;
    ctx.logger.info('Agent network completed with status: %s', status);

    return resp.text(fullText || 'Network processing completed.');
  } catch (error) {
    ctx.logger.error('Error running agent network:', error);

    return resp.text('Sorry, there was an error processing your request with the agent network.');
  }
}
