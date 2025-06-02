# agents/MovieAgent/main.py

from agentuity import AgentRequest, AgentResponse, AgentContext
import asyncio
from agents.MovieAgent.movie_agent import movie_recommendation_agent  # Agno agent

# Welcome message shown in Agentuity UI
def welcome():
    return {
        "welcome": "🎬 Tell me your favorite genres, movies, or actors—I'll recommend what to watch next!",
    }

# Agentuity async handler → runs Agno agent
async def run(request: AgentRequest, response: AgentResponse, context: AgentContext):
    prompt = await request.data.text()  # Agentuity passes user input
    context.logger.info(f"[MovieAgent] prompt: {prompt!r}")  # Agentuity logging

    try:
        loop = asyncio.get_running_loop()
        raw = await loop.run_in_executor(None, lambda: movie_recommendation_agent.run(prompt))

        if isinstance(raw, str):
            output = raw
        elif hasattr(raw, "content"):
            output = raw.content
        elif hasattr(raw, "reply"):
            output = raw.reply
        else:
            output = str(raw)

        if not output.strip():
            context.logger.error("[MovieAgent] empty output") # Agentuity logging
            return response.text("⚠️ No recommendations generated. Try refining your request.")

        return response.text(output) # Agentuity formats and sends response

    except Exception as exc:
        context.logger.error(f"[MovieAgent] fatal error: {exc}", exc_info=True) # Agentuity logging
        return response.text("❌ Internal error. Please try again later.")
