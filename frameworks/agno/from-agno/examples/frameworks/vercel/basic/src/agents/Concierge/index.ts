import type { AgentContext, AgentRequest, AgentResponse } from '@agentuity/sdk';
import { anthropic } from '@ai-sdk/anthropic';
import { generateObject } from 'ai';
import { z } from 'zod';

export default async function Agent(
  req: AgentRequest,
  resp: AgentResponse,
  ctx: AgentContext
) {
  const prompt =
    (await req.data.text()) ?? 'Recommend dinner spots in Austin, TX';

  // Store interaction history
  await ctx.kv.set('user-history', ctx.runId, {
    query: prompt,
  });

  // Get user intent
  const userIntent = await generateObject({
    model: anthropic('claude-3-7-sonnet-latest'),
    system: `
			You serve as a central hub that routes user requests to the right
			AI agent based on the user's intent. Classify the user's intent
			and select the best agent to handle it.
		`,
    schema: z.object({
      agentType: z.enum(['LocalGuide']),
    }),
    prompt,
  });

  // Route to appropriate agent based on intent
  if (userIntent.object?.agentType === 'LocalGuide') {
    return await resp.handoff(
      { name: 'LocalGuide' },
      {
        data: prompt,
        contentType: 'text/plain',
      }
    );
  }

  return resp.text("Sorry, I don't know how to help with that.");
}
