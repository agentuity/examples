"""
Travel Planner Agent async interface module.

Provides the async interface for the Travel Planner Agent, handling query parsing,
prompt formatting, and integration with the synchronous travel planner.
"""

import asyncio

from agentuity import AgentRequest, AgentResponse, AgentContext
from agents.TravelPlannerAgent.travel_planner import travel_planner
from agents.TravelPlannerAgent.query_parser import parse_user_query


def welcome():
    return {
        "welcome": "🌍 I'm a Travel Planner Agent. Tell me where you want to go, when, with whom, and how much you want to spend.",
        "examples": [
            "Plan a 5-day cultural exploration trip to Kyoto for a family of 4",
            "Create a romantic weekend getaway in Paris with a $2000 budget",
            "Organize a 7-day adventure trip to New Zealand for solo travel",
            "Design a tech company offsite in Barcelona for 20 people",
            "Plan a luxury honeymoon in Maldives for 10 days"
        ]
    }

async def run(request: AgentRequest, response: AgentResponse, context: AgentContext):
    prompt = await request.data.text()
    context.logger.info(f"[TravelPlannerAgent] prompt: {prompt!r}")

    try:
        parsed_info = await parse_user_query(prompt)
        context.logger.info(f"[TravelPlannerAgent] parsed_info: {parsed_info!r}")

        formatted_prompt = f"""
I want to plan a {parsed_info.get("trip_style", "fun")} trip to {parsed_info.get("destination", "somewhere nice")} with {parsed_info.get("group_size", 2)} people, 
around {parsed_info.get("dates", "sometime soon")} for {parsed_info.get("duration_days", 5)} days, with a total budget of ${parsed_info.get("budget_total", 2000)}.

We're a group of {parsed_info.get("group_type", "friends")}, and we'd like to include things like {", ".join(parsed_info.get("preferred_activities", [])) or "local food, sightseeing, and chill time"}.
"""

        loop = asyncio.get_running_loop()
        raw = await loop.run_in_executor(None, lambda: travel_planner.run(formatted_prompt.strip()))

        if isinstance(raw, str):
            output = raw
        elif hasattr(raw, "content"):
            output = raw.content
        elif hasattr(raw, "reply"):
            output = raw.reply
        else:
            output = str(raw)

        if not output.strip():
            context.logger.error("[TravelPlannerAgent] empty output")
            return response.text("⚠️ Couldn't generate a travel plan. Try again with more details.")

        return response.text(output)

    except Exception as exc:
        context.logger.error(f"[TravelPlannerAgent] fatal error: {exc}", exc_info=True)
        return response.text("❌ Something went wrong while generating your itinerary.")
