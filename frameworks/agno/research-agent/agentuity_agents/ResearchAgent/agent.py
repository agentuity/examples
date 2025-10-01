from agentuity import AgentRequest, AgentResponse, AgentContext
import asyncio

from agentuity_agents.ResearchAgent.research_agent import research_agent

def welcome():
    return {
        "welcome": "📰 I'm a Research Agent. Give me a topic and I'll deliver a professional-grade investigative article using DuckDuckGo search and article extraction.",
        "prompts": [
            {"data": "Research the latest developments in quantum computing", "contentType": "text/plain"},
            {"data": "Investigate the impact of AI on healthcare delivery", "contentType": "text/plain"},
            {"data": "Analyze recent climate change policy changes globally", "contentType": "text/plain"},
        ]
    }

async def run(request: AgentRequest, response: AgentResponse, context: AgentContext):
    prompt = await request.data.text()
    context.logger.info(f"[ResearchAgent] prompt: {prompt!r}")

    try:
        loop = asyncio.get_running_loop()
        raw = await loop.run_in_executor(None, lambda: research_agent.run(prompt))

        if isinstance(raw, str):
            output = raw
        elif hasattr(raw, "content"):
            output = raw.content
        elif hasattr(raw, "reply"):
            output = raw.reply
        else:
            output = str(raw)

        if not output.strip():
            context.logger.error("[ResearchAgent] empty output")
            return response.text("⚠️ Couldn't produce a research report. Try again with a more specific prompt.")

        return response.text(output)

    except Exception as exc:
        context.logger.error(f"[ResearchAgent] fatal error: {exc}", exc_info=True)
        return response.text("❌ Something went wrong while generating your report.")
