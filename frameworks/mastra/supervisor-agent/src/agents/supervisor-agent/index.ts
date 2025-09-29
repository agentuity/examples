import type { AgentContext, AgentRequest, AgentResponse } from '@agentuity/sdk';
import { openai } from '@ai-sdk/openai';
import { Agent as MastraAgent } from '@mastra/core/agent';

export const welcome = () => {
  return {
    welcome:
      'Welcome to the Mastra Supervisor Agent! I coordinate copywriter, editor, and publisher agents to create high-quality blog posts.',
    prompts: [
      {
        data: 'Write a blog post about React JavaScript',
        contentType: 'text/plain',
      },
      {
        data: 'Create a blog post about artificial intelligence trends',
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
    const topic = (await req.data.text()) ?? 'Write a blog post about React JavaScript';
    
    ctx.logger.info('Processing blog post request for topic: %s', topic);

    const copywriterAgent = new MastraAgent({
      name: 'copywriter-agent',
      instructions: 'You are a copywriter agent that writes blog post copy.',
      model: openai('gpt-4o-mini'),
    });

    const copywriterResult = await copywriterAgent.generate(`Create a blog post about ${topic}`, { maxSteps: 5 });
    const initialCopy = copywriterResult.text;

    if (!initialCopy) {
      throw new Error('Copywriter agent failed to generate content');
    }

    ctx.logger.info('Copywriter completed initial draft');

    const editorAgent = new MastraAgent({
      name: 'editor',
      instructions: 'You are an editor agent that edits blog post copy.',
      model: openai('gpt-4o-mini'),
    });

    const editorResult = await editorAgent.generate(`Edit the following blog post: ${initialCopy}`, { maxSteps: 5 });
    const editedCopy = editorResult.text;

    if (!editedCopy) {
      throw new Error('Editor agent failed to edit content');
    }

    ctx.logger.info('Editor completed content refinement');

    const publisherAgent = new MastraAgent({
      name: 'publisherAgent',
      instructions: 'You are a publisher agent that finalizes blog post content for publication.',
      model: openai('gpt-4o-mini'),
    });

    const publisherResult = await publisherAgent.generate(`Finalize this blog post for publication: ${editedCopy}`, { maxSteps: 5 });
    const finalContent = publisherResult.text;

    ctx.logger.info('Publisher completed final review');

    return resp.text(finalContent ?? 'Something went wrong during the publishing process');
  } catch (error) {
    ctx.logger.error('Error running supervisor agent:', error);
    
    return resp.text('Sorry, there was an error processing your request.');
  }
}
