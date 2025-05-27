import type { AgentContext, AgentRequest, AgentResponse } from '@agentuity/sdk';
import { anthropic } from '@ai-sdk/anthropic';
import { Agent } from '@mastra/core/agent';

export default async function AgentuityAgent(
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
  const agent = new Agent({
    name: 'Concierge',
    model: anthropic('claude-3-7-sonnet-latest'),
    instructions: `
			You serve as a central hub that routes user requests to the right
			AI agent based on the user's intent. Classify the user's intent and
			select the best agent (for now, just "LocalGuide") to handle it.
			Respond ONLY with the agent name.
		`,
  });

  const result = await agent.generate(prompt, { maxSteps: 5 });
  const userIntent = result.text?.trim();

  // Route to appropriate agent based on intent
  if (userIntent === 'LocalGuide') {
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
