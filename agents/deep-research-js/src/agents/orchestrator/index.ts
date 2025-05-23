import type { AgentRequest, AgentResponse, AgentContext } from '@agentuity/sdk';
import { generateText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';

export const welcome = () => {
  return {
    welcome:
      "Welcome to the Vercel AI SDK with Anthropic Agent! I can help you build AI-powered applications using Vercel's AI SDK with Claude models.",
    prompts: [
      {
        data: 'How do I implement streaming responses with Claude models?',
        contentType: 'text/plain',
      },
      {
        data: 'What are the best practices for prompt engineering with Claude?',
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
  const res = await generateText({
    model: anthropic('claude-3-5-sonnet-latest'),
    system: 'You are a friendly assistant!',
    prompt: (await req.data.text()) ?? 'Why is the sky blue?',
  });
  return resp.text(res.text);
}
