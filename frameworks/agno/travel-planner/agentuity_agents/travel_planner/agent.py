"""
Travel Planner Agent async interface module.

Provides the async interface for the Travel Planner Agent, handling query parsing,
prompt formatting, and integration with the synchronous travel agent.
"""

import asyncio

from agentuity import AgentRequest, AgentResponse, AgentContext
from agentuity_agents.travel_planner.travel_agent import travel_agent
from agentuity_agents.travel_planner.query_parser import parse_user_query


def welcome():
    return {
        "welcome": "🌍 I'm a Travel Planner Agent powered by Globe Hopper. Tell me where you want to go, when, with whom, and how much you want to spend, and I'll create a detailed travel itinerary for you!",
        "prompts": [
            {
                "data": "Plan a 7-day trip to Japan for 2 people in April 2025 with a budget of $4000",
                "contentType": "text/plain"
            },
            {
                "data": "I want to go to Italy for a romantic getaway, 5 days, around $3000 for two people",
                "contentType": "text/plain"
            },
            {
                "data": "Plan a family vacation to Costa Rica for 4 people, 10 days, budget $6000, we love adventure activities",
                "contentType": "text/plain"
            }
        ]
    }

async def run(request: AgentRequest, response: AgentResponse, context: AgentContext):
    prompt = await request.data.text()
    context.logger.info(f"[TravelPlanner] prompt: {prompt!r}")

    try:
        parsed_info = await parse_user_query(prompt)
        context.logger.info(f"[TravelPlanner] parsed_info: {parsed_info!r}")

        info = parsed_info or {}
        activities = info.get("preferred_activities", [])
        if not isinstance(activities, list):
            activities = [activities] if activities else []
        activities_str = ", ".join(map(str, activities)) or "local food, sightseeing, and chill time"

        formatted_prompt = f"""
I want to plan a {info.get("trip_style", "fun")} trip to {info.get("destination", "somewhere nice")} with {info.get("group_size", 2)} people, 
around {info.get("dates", "sometime soon")} for {info.get("duration_days", 5)} days, with a total budget of ${info.get("budget_total", 2000)}.

We're a group of {info.get("group_type", "friends")}, and we'd like to include things like {activities_str}.
"""

        loop = asyncio.get_running_loop()
        raw = await loop.run_in_executor(None, lambda: travel_agent.run(formatted_prompt.strip()))

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
