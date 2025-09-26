import type { AgentContext, AgentRequest, AgentResponse } from '@agentuity/sdk';
import { Agent } from '@mastra/core/agent';
import { OpenAIVoice } from '@mastra/voice-openai';
import { openai } from '@ai-sdk/openai';

export const welcome = () => {
  return {
    welcome:
      'Welcome to the Mastra Unified Voice Agent! I use a single voice provider that handles both speech-to-text and text-to-speech functions.',
    prompts: [
      {
        data: 'What can you tell me about voice AI?',
        contentType: 'text/plain',
      },
      {
        data: 'How does unified voice processing work?',
        contentType: 'text/plain',
      },
      {
        data: 'Speak to me about the future of AI',
        contentType: 'text/plain',
      },
    ],
  };
};

export default async function AgentuityAgent(
  req: AgentRequest,
  resp: AgentResponse,
  ctx: AgentContext
) {
  const prompt = await req.data.text();

  try {
    const unifiedVoiceAgent = new Agent({
      name: 'unified-voice-agent',
      model: openai('gpt-4o-mini'),
      instructions: 'You are a helpful assistant with voice capabilities.',
      voice: new OpenAIVoice()
    });

    const result = await unifiedVoiceAgent.generate(prompt, { maxSteps: 5 });

    return resp.text(result.text);
  } catch (error) {
    ctx.logger.error(
      'Error generating response: %s',
      error instanceof Error ? error.message : String(error)
    );

    return resp.text(
      "I'm sorry, I encountered an error while processing your voice request."
    );
  }
}
