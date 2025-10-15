import type { AgentContext, AgentRequest, AgentResponse } from '@agentuity/sdk';
import { Agent as MastraAgent } from '@mastra/core/agent';
import { openai } from '@ai-sdk/openai';

const mastraAgent = new MastraAgent({
  name: 'Voice Agent',
  instructions: 'You are a helpful assistant. Respond to user queries in a friendly and helpful manner.',
  model: openai('gpt-4o'),
});

export const welcome = () => {
  return {
    welcome:
      'Welcome to the Mastra Voice Agent! This agent demonstrates how to use Mastra framework with OpenAI models. While this example shows basic text generation, Mastra also supports voice capabilities (TTS and STT) through providers like OpenAI Voice, ElevenLabs, Google, and more.',
    prompts: [
      {
        data: 'What can you tell me about Mastra voice capabilities?',
        contentType: 'text/plain',
      },
      {
        data: 'How does Mastra help build AI agents?',
        contentType: 'text/plain',
      },
      {
        data: 'What voice providers does Mastra support?',
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
    
    ctx.logger.info('Generating response for user input: %s', userInput);
    
    const response = await mastraAgent.generate(userInput);
    
    ctx.logger.info('Generated response successfully');
    
    return resp.json({
      text: response.text,
      usage: response.usage,
    });
  } catch (error) {
    ctx.logger.error('Error running Mastra agent:', error);
    
    return resp.text('Sorry, there was an error processing your request.');
  }
}
