from agentuity import AgentRequest, AgentResponse, AgentContext
import asyncio

# Import the Agno agent
from agents.YouTubeAgent.youtube_agent import youtube_agent

#greeting
def welcome():
    return {
        "welcome": "🎬  I’m a YouTube Content Analyzer. Paste any YouTube link and tell me what you need!",
    }

# Async bridge Agentuity ➜ Agno YouTube agent
async def run(request: AgentRequest, response: AgentResponse, context: AgentContext):
    prompt = await request.data.text()
    context.logger.info(f"[YouTubeAgent] prompt: {prompt!r}")

    try:
        loop = asyncio.get_running_loop()
        raw = await loop.run_in_executor(None, lambda: youtube_agent.run(prompt))

        # ----- normalize output --------------------------------------------
        if isinstance(raw, str):
            output = raw

        # agno.run.response.RunResponse → get .content or fallback to str()
        elif hasattr(raw, "content"):
            output = raw.content
        elif hasattr(raw, "reply"):
            output = raw.reply
        else:
            output = str(raw)          # __str__ usually returns markdown

        # safety check
        if not output.strip():
            context.logger.error("[YouTubeAgent] empty output")
            return response.text("⚠️ Analyzer produced no content.")

        return response.text(output)

    except Exception as exc:
        context.logger.error(f"[YouTubeAgent] fatal error: {exc}", exc_info=True)
        return response.text("❌ An internal error occurred while analyzing the video.")
