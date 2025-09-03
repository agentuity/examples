from agentuity import AgentRequest, AgentResponse, AgentContext
import asyncio

from agents.ResearchAgent.research_agent import research_agent

def welcome():
    return {
        "welcome": "📰 I'm a Research Agent powered by Agno. Give me a topic and I'll deliver a professional-grade investigative article with comprehensive research and analysis.",
        "examples": [
            "Analyze the impact of AI on healthcare delivery and patient outcomes",
            "Report on the latest breakthroughs in quantum computing",
            "Investigate the global transition to renewable energy sources",
            "Explore the evolution of cybersecurity threats and defenses",
            "Research the development of autonomous vehicle technology"
        ]
    }

async def run(request: AgentRequest, response: AgentResponse, context: AgentContext):
    try:
        prompt = await request.data.text()
        context.logger.info(f"[ResearchAgent] Received research topic: {prompt!r}")

        loop = asyncio.get_running_loop()
        raw_result = await loop.run_in_executor(None, lambda: research_agent.run(prompt))

        if isinstance(raw_result, str):
            output = raw_result
        elif hasattr(raw_result, "content"):
            output = raw_result.content
        elif hasattr(raw_result, "reply"):
            output = raw_result.reply
        else:
            output = str(raw_result)

        if not output.strip():
            context.logger.error("[ResearchAgent] Empty output from Agno agent")
            return response.text("⚠️ Unable to generate research report. Please try again with a more specific topic.")

        context.logger.info(f"[ResearchAgent] Successfully generated report of {len(output)} characters")
        
        return response.text(output)

    except Exception as exc:
        context.logger.error(f"[ResearchAgent] Error during research: {exc}", exc_info=True)
        return response.text("❌ An error occurred while conducting research. Please try again with a different topic.")
