from agentuity import AgentRequest, AgentResponse, AgentContext
import asyncio
from agents.SocialAgent.social_agent import build_crew

def welcome():
    return {
        "welcome": "📣 I'm your LinkedIn Social Content Crew. Just give me a topic or trend, your name, and a bit about what you do - I’ll take care of the rest and write posts ready to publish."
    }

async def run(request: AgentRequest, response: AgentResponse, context: AgentContext):
    try:
        prompt = await request.data.text()
        context.logger.info(f"[SocialAgent] Received prompt: {prompt!r}")

        topic = prompt  # or parse it if structured
        company_name = "ExampleCorp"
        company_description = "a leading AI startup building tools for social content"
        style_description = "conversational and concise"

        loop = asyncio.get_running_loop()
        result = await loop.run_in_executor(None, lambda: build_crew(
            topic=topic,
            company_name=company_name,
            company_description=company_description,
            style_description=style_description
        ).kickoff(inputs={"topic": topic}))

        return response.text(result if isinstance(result, str) else str(result))
    except Exception as e:
        context.logger.error(f"Error running SocialAgent: {e}", exc_info=True)
        return response.text("❌ Something went wrong while generating your LinkedIn content.")
