from agentuity import AgentRequest, AgentResponse, AgentContext
import asyncio

from agents.AcademicResearchAgent.aca_research_agent import aca_research_agent

def welcome():
    return {
        "welcome": "📚 I’m an Academic Research Agent. Give me a scholarly topic, and I’ll return a fully structured, citation-ready research report.",
    }

# Agentuity passes user input
async def run(request: AgentRequest, response: AgentResponse, context: AgentContext):
    prompt = await request.data.text()
    context.logger.info(f"[AcademicResearchAgent] prompt: {prompt!r}")

    try:
        loop = asyncio.get_running_loop()
        raw = await loop.run_in_executor(None, lambda: aca_research_agent.run(prompt))

        if isinstance(raw, str):
            output = raw
        elif hasattr(raw, "content"):
            output = raw.content
        elif hasattr(raw, "reply"):
            output = raw.reply
        else:
            output = str(raw)

        if not output.strip():
            context.logger.error("[AcademicResearchAgent] empty output")
            return response.text("⚠️ Couldn’t generate a research report. Try a different or more specific topic.")

        return response.text(output)

    except Exception as exc:
        context.logger.error(f"[AcademicResearchAgent] fatal error: {exc}", exc_info=True)
        return response.text("❌ Something went wrong while producing your academic report.")
