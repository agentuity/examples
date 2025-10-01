"""
Travel Planner Agent async interface module.

Provides the async interface for the Travel Planner Agent,
integrating with the synchronous Agno travel agent.
"""

import asyncio

from agentuity import AgentRequest, AgentResponse, AgentContext
from agentuity_agents.TravelPlanner.travel_planner import travel_agent


def welcome():
    return {
        "welcome": "🌍 I'm a Travel Planner Agent. Tell me where you want to go, when, with whom, and how much you want to spend.",
        "prompts": [
            {"data": "Plan a 5-day cultural exploration trip to Kyoto for a family of 4", "contentType": "text/plain"},
            {"data": "Create a romantic weekend getaway in Paris with a $2000 budget", "contentType": "text/plain"},
            {"data": "Organize a 7-day adventure trip to New Zealand for solo travel", "contentType": "text/plain"},
        ]
    }

async def run(request: AgentRequest, response: AgentResponse, context: AgentContext):
    try:
        prompt = await request.data.text()
        context.logger.info(f"[TravelPlanner] prompt: {prompt!r}")

        loop = asyncio.get_running_loop()
        raw = await loop.run_in_executor(None, lambda: travel_agent.run(prompt.strip()))

        if isinstance(raw, str):
            output = raw
        elif hasattr(raw, "content"):
            output = raw.content
        elif hasattr(raw, "reply"):
            output = raw.reply
        else:
            output = str(raw)

        if not output.strip():
            context.logger.error("[TravelPlanner] empty output")
            return response.text("⚠️ Couldn't generate a travel plan. Try again with more details.")

        return response.text(output)

    except Exception as exc:
        context.logger.error(f"[TravelPlanner] fatal error: {exc}", exc_info=True)
        return response.text("❌ Something went wrong while generating your itinerary.")
