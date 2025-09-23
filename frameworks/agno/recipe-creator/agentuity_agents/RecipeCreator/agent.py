from agentuity import AgentRequest, AgentResponse, AgentContext
import asyncio

from agentuity_agents.RecipeCreator.recipe_agent import recipe_agent


def welcome():
    return {
        "welcome": "👩‍🍳 Tell me what ingredients you have and any preferences—I'll craft a recipe for you!",
    }


async def run(request: AgentRequest, response: AgentResponse, context: AgentContext):
    prompt = await request.data.text()
    context.logger.info(f"[RecipeAgent] prompt: {prompt!r}")

    try:
        loop = asyncio.get_running_loop()
        raw = await loop.run_in_executor(None, lambda: recipe_agent.run(prompt))

        if isinstance(raw, str):
            output = raw
        elif hasattr(raw, "content"):
            output = raw.content
        elif hasattr(raw, "reply"):
            output = raw.reply
        else:
            output = str(raw)

        if not output.strip():
            context.logger.error("[RecipeAgent] empty output")
            return response.text("⚠️ No recipe could be generated. Try a different query.")

        return response.text(output)

    except Exception as exc:
        context.logger.error(f"[RecipeAgent] fatal error: {exc}", exc_info=True)
        return response.text("❌ There was an internal error generating your recipe.")
