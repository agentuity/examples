import type { AgentContext, AgentRequest, AgentResponse } from '@agentuity/sdk';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

export const welcome = () => {
  return {
    welcome: 'Welcome to the Mastra Supervisor Agent! I coordinate a team of copywriter, editor, and publisher agents to create high-quality content.',
    prompts: [
      {
        data: 'Write a blog post about the benefits of AI in healthcare',
        contentType: 'text/plain',
      },
      {
        data: 'Create marketing copy for a new productivity app',
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
    const prompt = (await req.data.text()) ?? 'Write a blog post about AI';
    
    ctx.logger.info('Starting supervisor agent workflow for prompt: %s', prompt);

    const copywriterResult = await generateText({
      model: openai('gpt-4o-mini'),
      prompt: `You are a skilled copywriter. Create engaging, well-structured content based on the user's request. Focus on clarity, creativity, and audience engagement.\n\nUser request: ${prompt}`,
    });
    const initialContent = copywriterResult.text;
    
    ctx.logger.info('Copywriter completed initial content');

    const editorResult = await generateText({
      model: openai('gpt-4o-mini'),
      prompt: `You are an experienced editor. Review and improve the provided content for grammar, style, flow, and overall quality. Make it more polished and professional.\n\nContent to edit:\n\n${initialContent}`,
    });
    const editedContent = editorResult.text;
    
    ctx.logger.info('Editor completed content refinement');

    const publisherResult = await generateText({
      model: openai('gpt-4o-mini'),
      prompt: `You are a publisher who supervises content creation. Review the edited content and decide if it's ready for publication. If needed, provide final touches or request revisions. Always provide the final approved content.\n\nContent to review:\n\n${editedContent}`,
    });
    const finalContent = publisherResult.text;
    
    ctx.logger.info('Publisher completed final review and approval');

    await ctx.kv.set('supervisor-workflow', ctx.runId, {
      originalPrompt: prompt,
      copywriterContent: initialContent,
      editorContent: editedContent,
      finalContent: finalContent,
      timestamp: new Date().toISOString(),
    });

    return resp.text(finalContent);
  } catch (error) {
    ctx.logger.error('Error in supervisor agent workflow:', error);
    return resp.text('Sorry, there was an error processing your request. Please try again.');
  }
}
