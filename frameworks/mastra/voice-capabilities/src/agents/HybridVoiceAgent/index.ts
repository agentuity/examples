import type { AgentContext, AgentRequest, AgentResponse } from '@agentuity/sdk';
import { Agent } from '@mastra/core/agent';
import { CompositeVoice } from '@mastra/core/voice';
import { OpenAIVoice } from '@mastra/voice-openai';
import { openai } from '@ai-sdk/openai';

export const welcome = () => {
  return {
    welcome:
      'Welcome to the Mastra Hybrid Voice Agent! I can speak and listen using different providers for speech-to-text and text-to-speech functionality.',
    prompts: [
      {
        data: 'Tell me about the weather today',
        contentType: 'text/plain',
      },
      {
        data: 'Have a conversation with me about AI',
        contentType: 'text/plain',
      },
      {
        data: 'Explain how voice agents work',
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
    const hybridVoiceAgent = new Agent({
      name: 'hybrid-voice-agent',
      model: openai('gpt-4o-mini'),
      instructions: 'You can speak and listen using different providers.',
      voice: new CompositeVoice({
        input: new OpenAIVoice(),
        output: new OpenAIVoice()
      })
    });

    const result = await hybridVoiceAgent.generate(prompt, { maxSteps: 5 });

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
