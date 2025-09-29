from agentuity import AgentRequest, AgentResponse, AgentContext
import asyncio

# Import the Agno agent
from agentuity_agents.TweetAnalysisAgent.tweet_analysis_agent import social_media_agent

def welcome():
    return {
        "welcome": "🐦 I'm a Tweet Analysis Agent specializing in social media intelligence and brand monitoring. Provide me with a topic or brand to analyze on X (Twitter)!",
        "prompts": [
            {
                "data": "Analyze sentiment around Agno and AgnoAGI on X for the past 10 tweets",
                "contentType": "text/plain"
            },
            {
                "data": "Monitor competitor mentions and compare sentiment vs our brand",
                "contentType": "text/plain"
            },
            {
                "data": "Generate a brand health report from recent social media activity",
                "contentType": "text/plain"
            }
        ]
    }

async def run(request: AgentRequest, response: AgentResponse, context: AgentContext):
    prompt = await request.data.text()
    context.logger.info(f"[TweetAnalysisAgent] prompt: {prompt!r}")

    try:
        loop = asyncio.get_running_loop()
        raw = await loop.run_in_executor(None, lambda: social_media_agent.run(prompt))

        if isinstance(raw, str):
            output = raw
        elif hasattr(raw, "content"):
            output = raw.content
        elif hasattr(raw, "reply"):
            output = raw.reply
        else:
            output = str(raw)

        if not output.strip():
            context.logger.error("[TweetAnalysisAgent] empty output")
            return response.text("⚠️ Analysis produced no content.")

        return response.text(output)

    except Exception as exc:
        context.logger.error(f"[TweetAnalysisAgent] fatal error: {exc}", exc_info=True)
        return response.text("❌ An internal error occurred while analyzing tweets.")
