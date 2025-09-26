from agentuity import AgentRequest, AgentResponse, AgentContext
import asyncio

from agentuity_agents.AirbnbMcp.airbnb_mcp_agent import run_agent


def welcome():
    return {
        "welcome": "🏠 Welcome to the Airbnb MCP Assistant! I can help you search for accommodations, get property details, and assist with booking questions.",
        "prompts": [
            {
                "data": "Find me a 2-bedroom apartment in San Francisco for next weekend",
                "contentType": "text/plain"
            },
            {
                "data": "What amenities are available at property ID 12345?",
                "contentType": "text/plain"
            },
            {
                "data": "Help me understand the booking process for a vacation rental",
                "contentType": "text/plain"
            }
        ]
    }


async def run(request: AgentRequest, response: AgentResponse, context: AgentContext):
    prompt = await request.data.text()
    context.logger.info(f"[AirbnbMcp] prompt: {prompt!r}")

    try:
        loop = asyncio.get_running_loop()
        raw = await loop.run_in_executor(None, lambda: asyncio.run(run_agent(prompt)))

        if isinstance(raw, str):
            output = raw
        elif hasattr(raw, "content"):
            output = raw.content
        elif hasattr(raw, "reply"):
            output = raw.reply
        else:
            output = str(raw)

        if not output.strip():
            context.logger.error("[AirbnbMcp] empty output")
            return response.text("⚠️ No response could be generated. Try a different query.")

        return response.text(output)

    except Exception as exc:
        context.logger.error(f"[AirbnbMcp] fatal error: {exc}", exc_info=True)
        return response.text("❌ There was an internal error processing your Airbnb request.")
