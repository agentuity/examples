from agentuity import AgentRequest, AgentResponse, AgentContext
import asyncio

from agentuity_agents.StudyPartner.study_partner_agent import study_partner

def welcome():
    return {
        "welcome": "📚 I'm your Study Partner! I help you find learning resources, create study plans, and provide explanations on various topics. Give me a subject you want to learn and I'll create a personalized learning path.",
        "prompts": [
            {"data": "I want to learn about Postgres in depth. I know the basics, have 2 weeks to learn, and can spend 3 hours daily. Please share some resources and a study plan.", "contentType": "text/plain"},
            {"data": "Help me understand machine learning fundamentals with hands-on projects", "contentType": "text/plain"},
            {"data": "Create a study plan for learning React.js from scratch in 1 month", "contentType": "text/plain"}
        ]
    }

async def run(request: AgentRequest, response: AgentResponse, context: AgentContext):
    prompt = await request.data.text()
    context.logger.info(f"[StudyPartner] prompt: {prompt!r}")

    try:
        loop = asyncio.get_running_loop()
        raw = await loop.run_in_executor(None, lambda: study_partner.run(prompt))

        if isinstance(raw, str):
            output = raw
        elif hasattr(raw, "content"):
            output = raw.content
        elif hasattr(raw, "reply"):
            output = raw.reply
        else:
            output = str(raw)

        if not output.strip():
            context.logger.error("[StudyPartner] empty output")
            return response.text("⚠️ Couldn't create a study plan. Try again with a more specific learning goal.")

        return response.text(output)

    except Exception as exc:
        context.logger.error(f"[StudyPartner] fatal error: {exc}", exc_info=True)
        return response.text("❌ Something went wrong while creating your study plan.")
