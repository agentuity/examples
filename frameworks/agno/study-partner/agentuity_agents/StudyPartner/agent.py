from agentuity import AgentRequest, AgentResponse, AgentContext
import asyncio

from agentuity_agents.StudyPartner.study_partner import study_partner

def welcome():
    return {
        "welcome": "📚 I'm StudyScout, your AI study partner! I help you find learning resources, create study plans, and provide explanations on various topics. What would you like to learn about?",
        "prompts": [
            {"data": "I want to learn Python programming from scratch. I have 4 weeks and can study 2 hours daily.", "contentType": "text/plain"},
            {"data": "Help me understand machine learning concepts with practical examples and resources.", "contentType": "text/plain"},
            {"data": "Create a study plan for learning web development with HTML, CSS, and JavaScript.", "contentType": "text/plain"}
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
            return response.text("⚠️ Study partner produced no content.")

        return response.text(output)

    except Exception as exc:
        context.logger.error(f"[StudyPartner] fatal error: {exc}", exc_info=True)
        return response.text("❌ An internal error occurred while processing your study request.")
