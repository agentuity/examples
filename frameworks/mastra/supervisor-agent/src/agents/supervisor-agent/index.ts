import type { AgentContext, AgentRequest, AgentResponse } from '@agentuity/sdk';
import { openai } from '@ai-sdk/openai';
import { Agent } from '@mastra/core/agent';
import { Mastra } from '@mastra/core/mastra';
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

const copywriterAgent = new Agent({
  name: 'copywriter-agent',
  instructions: 'You are a copywriter agent that writes blog post copy.',
  model: openai('gpt-4o'),
});

const editorAgent = new Agent({
  name: 'editor-agent',
  instructions: 'You are an editor agent that edits blog post copy.',
  model: openai('gpt-4o-mini'),
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
  execute: async ({ context, mastra }) => {
    const { topic } = context;
    const agent = mastra!.getAgent('copywriterAgent');
    const result = await agent!.generate(`Create a blog post about ${topic}`);
    return { copy: result.text };
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
  execute: async ({ context, mastra }) => {
    const { copy } = context;
    const agent = mastra!.getAgent('editorAgent');
    const result = await agent!.generate(
      `Edit the following blog post only returning the edited copy: ${copy}`
    );
    return { copy: result.text };
  },
});

const publisherAgent = new Agent({
  name: 'publisher-agent',
  instructions:
    'You are a publisher agent that first calls the copywriter agent to write blog post copy about a specific topic and then calls the editor agent to edit the copy. Just return the final edited copy.',
  model: openai('gpt-4o-mini'),
  tools: { copywriterTool, editorTool },
});

const mastra = new Mastra({
  agents: { copywriterAgent, editorAgent, publisherAgent },
});

export const welcome = () => {
  return {
    welcome:
      'Welcome to the Mastra Supervisor Agent! I coordinate multiple specialized agents (copywriter and editor) to create high-quality blog posts. The publisher agent supervises the workflow.',
    prompts: [
      {
        data: 'Write a blog post about TypeScript best practices',
        contentType: 'text/plain',
      },
      {
        data: 'Create a blog post about cloud-native architecture',
        contentType: 'text/plain',
      },
    ],
  };
};

export default async function SupervisorAgent(
  req: AgentRequest,
  resp: AgentResponse,
  ctx: AgentContext
) {
  try {
    const prompt = (await req.data.text()) ?? 'Write a blog post about AI agents';
    
    ctx.logger.info('Supervisor agent starting with prompt: %s', prompt);
    
    const agent = mastra.getAgent('publisherAgent');
    const result = await agent!.generate(
      `${prompt}. Only return the final edited copy.`
    );

    ctx.logger.info('Supervisor agent completed successfully');
    
    return resp.text(result.text ?? 'No content generated');
  } catch (error) {
    ctx.logger.error('Error running supervisor agent:', error);
    return resp.text('Sorry, there was an error processing your request.');
  }
}
