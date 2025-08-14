import type { AgentContext, AgentRequest, AgentResponse } from '@agentuity/sdk';
import { openai } from '@ai-sdk/openai';
import { Agent } from '@mastra/core/agent';

export function welcome() {
  return {
    message:
      "I'm a geography expert that provides interesting facts about cities. Ask me about any city!",
    prompts: [
      'Tell me an interesting fact about London',
      "What's a lesser-known fact about Tokyo?",
      'Share something fascinating about New York City',
    ],
  };
}

export default async function AgentuityAgent(
  req: AgentRequest,
  resp: AgentResponse,
  ctx: AgentContext,
) {
  const prompt = await req.data.text();

  try {
    const cityAgent = new Agent({
      name: 'city-agent',
      description: 'Create facts for a city',
      instructions:
        'You are an expert in geography and travel. When given the name of a city, respond with one interesting, lesser-known fact about that city. Keep the response concise and factual.',
      model: openai('gpt-4o'),
    });

    const result = await cityAgent.generate(prompt);

    return resp.text(result.text);
  } catch (error) {
    ctx.logger.error(
      'Error generating city fact: %s',
      error instanceof Error ? error.message : String(error),
    );

    return resp.text(
      "I'm sorry, I encountered an error while processing your request about that city.",
    );
  }
}
