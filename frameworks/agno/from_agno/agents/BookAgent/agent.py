from agentuity import AgentRequest, AgentResponse, AgentContext
import asyncio

# Import the Agno agent
from agents.BookAgent.book_agent import book_recommendation_agent

# Welcome message shown in Agentuity UI
def welcome():
    return {
        "welcome": "📚 Tell me what kinds of books you like—I’ll find your next great read!",
    }

# Async wrapper to run Agno logic inside Agentuity
async def run(request: AgentRequest, response: AgentResponse, context: AgentContext):
    prompt = await request.data.text() # Agentuity passes user input
    context.logger.info(f"[BookAgent] prompt: {prompt!r}") # Agentuity logging

    try:
        loop = asyncio.get_running_loop()
        raw = await loop.run_in_executor(None, lambda: book_recommendation_agent.run(prompt))

        # Normalize output
        if isinstance(raw, str):
            output = raw
        elif hasattr(raw, "content"):
            output = raw.content
        elif hasattr(raw, "reply"):
            output = raw.reply
        else:
            output = str(raw)

        if not output.strip():
            context.logger.error("[BookAgent] empty output") # Agentuity logging
            return response.text("⚠️ No recommendations found. Try a different query.")

        return response.text(output) # Agentuity formats and sends response

    except Exception as exc:
        context.logger.error(f"[BookAgent] fatal error: {exc}", exc_info=True) # Agentuity logging
        return response.text("❌ An internal error occurred while generating your book list.")
