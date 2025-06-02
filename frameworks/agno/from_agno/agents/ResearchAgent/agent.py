from agentuity import AgentRequest, AgentResponse, AgentContext
import asyncio

from agents.ResearchAgent.research_agent import research_agent

def welcome():
    return {
        "welcome": "📰 I’m a Research Agent. Give me a topic and I’ll deliver a professional-grade investigative article.",
    }

# Agentuity passes user input
async def run(request: AgentRequest, response: AgentResponse, context: AgentContext):
    prompt = await request.data.text() # Agentuity passes user input
    context.logger.info(f"[ResearchAgent] prompt: {prompt!r}") # Agentuity logging

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
            context.logger.error("[ResearchAgent] empty output") # Agentuity logging
            return response.text("⚠️ Couldn’t produce a research report. Try again with a more specific prompt.")

        return response.text(output)

    except Exception as exc:
        context.logger.error(f"[ResearchAgent] fatal error: {exc}", exc_info=True) # Agentuity logging
        return response.text("❌ Something went wrong while generating your report.")
