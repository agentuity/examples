from agentuity import AgentRequest, AgentResponse, AgentContext
import asyncio
from agents.TravelAgent.travel_agent import travel_agent
from agents.TravelAgent.query_parser import parse_user_query  # <-- import your parser

def welcome():
    return {
        "welcome": "🌍 I’m a Travel Planner Agent. Tell me where you want to go, when, with whom, and how much you want to spend.",
    }

async def run(request: AgentRequest, response: AgentResponse, context: AgentContext):
    prompt = await request.data.text()
    context.logger.info(f"[TravelAgent] prompt: {prompt!r}")

    try:
        # 🔍 Step 1: Use parser to extract structured info
        parsed_info = await parse_user_query(prompt)
        context.logger.info(f"[TravelAgent] parsed_info: {parsed_info!r}")

        # ✏️ Step 2: Construct final prompt to send to travel_agent
        formatted_prompt = f"""
I want to plan a {parsed_info.get("trip_style", "fun")} trip to {parsed_info.get("destination", "somewhere nice")} with {parsed_info.get("group_size", 2)} people, 
around {parsed_info.get("dates", "sometime soon")} for {parsed_info.get("duration_days", 5)} days, with a total budget of ${parsed_info.get("budget_total", 2000)}.

We’re a group of {parsed_info.get("group_type", "friends")}, and we’d like to include things like {", ".join(parsed_info.get("preferred_activities", [])) or "local food, sightseeing, and chill time"}.
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
            context.logger.error("[TravelAgent] empty output")
            return response.text("⚠️ Couldn’t generate a travel plan. Try again with more details.")

        return response.text(output)

    except Exception as exc:
        context.logger.error(f"[TravelAgent] fatal error: {exc}", exc_info=True)
        return response.text("❌ Something went wrong while generating your itinerary.")
