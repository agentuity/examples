import type { AgentContext, AgentRequest, AgentResponse } from '@agentuity/sdk';
import { ChatAnthropic } from '@langchain/anthropic';
import { createReactAgent } from '@langchain/langgraph/prebuilt';

export default async function Agent(
  req: AgentRequest,
  resp: AgentResponse,
  ctx: AgentContext
) {
  const prompt = await req.data.text();

  const agent = createReactAgent({
    llm: new ChatAnthropic({
      model: 'claude-3-7-sonnet-latest',
    }),
    tools: [],
  });

  try {
    const result = await agent.invoke({
      messages: [
        {
          role: 'system',
          content: `
						You are local city guide, an AI assistant specializing in recommendations and information.
						
						Your expertise includes:
						- City-specific food and restaurant recommendations with local favorites
						- Entertainment options including museums, attractions, nightlife, and beaches
						- Transportation advice including public transit, ride-sharing, and navigation tips
						- Local cultural context, history, and city-specific tips

						Always provide specific, actionable information tailored to the city you are in.
						When making recommendations, include neighborhood information and local context.
						Include relevant details like price ranges, accessibility, and cultural significance.
					`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    return resp.text(
      result.messages[result.messages.length - 1]?.text ??
        "I'm sorry, I don't know how to help with that."
    );
  } catch (error) {
    ctx.logger.error(
      'Error generating response: %s',
      error instanceof Error ? error.message : String(error)
    );

    return resp.text(
      "I'm sorry, I encountered an error while processing your request."
    );
  }
}
