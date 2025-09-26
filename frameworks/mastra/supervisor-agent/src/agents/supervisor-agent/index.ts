import type { AgentContext, AgentRequest, AgentResponse } from '@agentuity/sdk';
import { openai } from '@ai-sdk/openai';
import { Agent as MastraAgent } from '@mastra/core/agent';
import { Mastra } from '@mastra/core/mastra';
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

const copywriterAgent = new MastraAgent({
  name: 'copywriter-agent',
  instructions: 'You are a copywriter agent that writes blog post copy.',
  model: openai('gpt-4o')
});

const editorAgent = new MastraAgent({
  name: 'Editor',
  instructions: 'You are an editor agent that edits blog post copy.',
  model: openai('gpt-4o-mini')
});

const copywriterTool = createTool({
  id: 'copywriter-agent',
  description: 'Calls the copywriter agent to write blog post copy.',
  inputSchema: z.object({
    topic: z.string()
  }),
  outputSchema: z.object({
    copy: z.string()
  }),
  execute: async ({ context, mastra }) => {
    const { topic } = context;
    const agent = mastra!.getAgent('copywriterAgent');
    const result = await agent!.generate(`Create a blog post about ${topic}`);
    return {
      copy: result.text
    };
  }
});

const editorTool = createTool({
  id: 'editor-agent',
  description: 'Calls the editor agent to edit blog post copy.',
  inputSchema: z.object({
    copy: z.string()
  }),
  outputSchema: z.object({
    copy: z.string()
  }),
  execute: async ({ context, mastra }) => {
    const { copy } = context;
    const agent = mastra!.getAgent('editorAgent');
    const result = await agent.generate(`Edit the following blog post only returning the edited copy: ${copy}`);
    return {
      copy: result.text
    };
  }
});

const publisherAgent = new MastraAgent({
  name: 'publisherAgent',
  instructions: 'You are a publisher agent that first calls the copywriter agent to write blog post copy about a specific topic and then calls the editor agent to edit the copy. Just return the final edited copy.',
  model: openai('gpt-4o-mini'),
  tools: { copywriterTool, editorTool }
});

const mastra = new Mastra({
  agents: { copywriterAgent, editorAgent, publisherAgent }
});

export const welcome = () => {
  return {
    welcome: 'Welcome to the Mastra Supervisor Agent! I coordinate copywriter, editor, and publisher agents to create high-quality blog posts collaboratively.',
    prompts: [
      {
        data: 'Write a blog post about React JavaScript frameworks',
        contentType: 'text/plain',
      },
      {
        data: 'Create a blog post about artificial intelligence and machine learning',
        contentType: 'text/plain',
      },
      {
        data: 'Write a blog post about sustainable technology trends',
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
    const topic = (await req.data.text()) ?? 'artificial intelligence';
    
    ctx.logger.info('Starting supervisor agent for topic: %s', topic);
    
    const agent = mastra.getAgent('publisherAgent');
    
    if (!agent) {
      throw new Error('Publisher agent not found');
    }
    
    const result = await agent.generate(`Write a blog post about ${topic}. Only return the final edited copy.`);
    
    ctx.logger.info('Successfully generated blog post');
    
    return resp.text(result.text);
  } catch (error) {
    ctx.logger.error('Error running supervisor agent:', error);
    return resp.text('Sorry, there was an error processing your request. Please try again.');
  }
}
