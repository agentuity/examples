import type { AgentContext, AgentRequest, AgentResponse } from '@agentuity/sdk';
import { openai } from '@ai-sdk/openai';
import { Agent as MastraAgent } from '@mastra/core/agent';
import { Mastra } from '@mastra/core/mastra';
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

const copywriterAgent = new MastraAgent({
  name: 'copywriter-agent',
  instructions: 'You are a copywriter agent that writes blog post copy.',
  model: openai('gpt-4o'),
});

const editorAgent = new MastraAgent({
  name: 'editor-agent',
  instructions: 'You are an editor agent that edits blog post copy.',
  model: openai('gpt-4o-mini'),
});

const mastra = new Mastra({
  agents: { copywriterAgent, editorAgent },
});

const copywriterTool = createTool({
  id: 'copywriter-agent',
  description: 'Calls the copywriter agent to write blog post copy.',
  inputSchema: z.object({
    topic: z.string(),
  }),
  outputSchema: z.object({
    copy: z.string(),
  }),
  execute: async ({ context }) => {
    const { topic } = context;
    const agent = mastra.getAgent('copywriterAgent');
    const result = await agent!.generate(`Create a blog post about ${topic}`);
    return {
      copy: result.text,
    };
  },
});

const editorTool = createTool({
  id: 'editor-agent',
  description: 'Calls the editor agent to edit blog post copy.',
  inputSchema: z.object({
    copy: z.string(),
  }),
  outputSchema: z.object({
    copy: z.string(),
  }),
  execute: async ({ context }) => {
    const { copy } = context;
    const agent = mastra.getAgent('editorAgent');
    const result = await agent!.generate(
      `Edit the following blog post only returning the edited copy: ${copy}`
    );
    return {
      copy: result.text,
    };
  },
});

const publisherAgent = new MastraAgent({
  name: 'publisherAgent',
  instructions:
    'You are a publisher agent that first calls the copywriter agent to write blog post copy about a specific topic and then calls the editor agent to edit the copy. Just return the final edited copy.',
  model: openai('gpt-4o-mini'),
  tools: { copywriterTool, editorTool },
});

export const welcome = () => {
  return {
    welcome:
      'Welcome to the Mastra Supervisor Agent! I coordinate a copywriter and editor to create polished blog posts. Give me a topic and I will write and edit a blog post for you.',
    prompts: [
      {
        data: 'Write a blog post about React JavaScript frameworks.',
        contentType: 'text/plain',
      },
      {
        data: 'Create a blog post about artificial intelligence and machine learning.',
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
    const prompt = userInput || 'Write a blog post about React JavaScript frameworks. Only return the final edited copy.';

    ctx.logger.info('Processing request with supervisor agent');

    const result = await publisherAgent.generate(prompt);

    return resp.text(result.text);
  } catch (error) {
    ctx.logger.error('Error running supervisor agent:', error);

    return resp.text('Sorry, there was an error processing your request.');
  }
}
