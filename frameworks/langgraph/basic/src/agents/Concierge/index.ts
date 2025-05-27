import type { AgentContext, AgentRequest, AgentResponse } from '@agentuity/sdk';
import { ChatAnthropic } from '@langchain/anthropic';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
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
  const agent = createReactAgent({
    llm: new ChatAnthropic({
      model: 'claude-3-7-sonnet-latest',
    }),
    responseFormat: z.object({
      agentType: z.enum(['LocalGuide']),
    }),
    tools: [],
  });

  const userIntent = await agent.invoke({
    messages: [
      {
        role: 'system',
        content: `
					You serve as a central hub that routes user requests to the right
					AI agent based on the user's intent. Classify the user's intent
					and select the best agent to handle it.
				`,
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  // Route to appropriate agent based on intent
  if (userIntent.structuredResponse.agentType === 'LocalGuide') {
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
