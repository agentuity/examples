import type { AgentRequest, AgentResponse, AgentContext } from '@agentuity/sdk';
import { Agent } from '@mastra/core/agent';
import { openai } from '@ai-sdk/openai';

export const welcome = () => {
  return {
    welcome: `Welcome to the Multi-Model AI Jury! 🏛️

This system evaluates your content using multiple AI models (GPT-4o Mini, GPT-4, and Claude) to provide a balanced, consensus-based assessment.

Enter in a topic and I will generate a blog post about it, along with a score from the jury!.`,
   
  };
};

export default async function ContentWriterAgent(
  req: AgentRequest,
  resp: AgentResponse,
  ctx: AgentContext
) {
  try {
    // Get the topic from the request
    const topic = (await req.data.text()) || 'Technology';
    ctx.logger.info(`Generating blog post about: ${topic}`);

    // Create a content writer agent using Mastra
    const contentAgent = new Agent({
      name: 'ContentWriter',
      instructions: 'You are an expert blog writer that creates well-structured, informative content.',
      model: openai('gpt-4o-mini'),
    });

    // Generate the blog post
    const blogResult = await contentAgent.generate(`
      Write a comprehensive, well-structured blog post about the following topic: ${topic}.
      The blog post should have:
      - An engaging title
      - A clear introduction
      - Well-organized body paragraphs with subheadings
      - A conclusion
      
      Make it informative, engaging, and approximately 500-800 words.
    `);
    
    const blogPost = blogResult.text;
    
    // Check if the user wants direct blog output or to evaluate it with Jury
    const evaluateFlag = req.get('evaluate', true);
    
    // If evaluate=false is explicitly set, only return the blog post without jury evaluation
    if (evaluateFlag === false) {
      ctx.logger.info('Returning blog post without evaluation');
      return resp.text(blogPost);
    }
    
    // Otherwise, hand off to the Jury agent for evaluation
    ctx.logger.info('Handing off blog post to Jury agent for evaluation');
    
    // Use the correctly typed handoff method
    return resp.handoff(
      { name: 'Jury' },  // Use the agent name in an object as required by GetAgentRequestParams
      {
        data: blogPost,  // The content to send to the Jury agent
        contentType: 'text/plain',  // Content type 
        metadata: { source: 'ContentWriter', topic: topic }  // Optional metadata
      }  
    );
  } catch (error) {
    ctx.logger.error('Error generating content:', error);
    return resp.text('Sorry, there was an error generating the blog post.');
  }
}
