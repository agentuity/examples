from agentuity import AgentRequest, AgentResponse, AgentContext
import asyncio

from agents.RecipeCreator.recipe_creator import recipe_agent


def welcome():
    return {
        "welcome": "🍳 I can help you find recipes! Tell me what ingredients you have or what type of dish you'd like to make.",
        "prompts": [
            "I have chicken, rice, and vegetables. What can I make?",
            "Show me a recipe for chocolate chip cookies",
            "I want to make a healthy vegetarian dinner"
        ]
    }


async def run(request: AgentRequest, response: AgentResponse, context: AgentContext):
    prompt = await request.data.text()
    context.logger.info(f"[RecipeCreator] prompt: {prompt!r}")

    try:
        loop = asyncio.get_running_loop()
        raw = await loop.run_in_executor(None, lambda: recipe_agent.run(prompt))

        # Unwrap whatever Agno returned
        if isinstance(raw, str):
            output = raw
        elif hasattr(raw, "content"):
            output = raw.content
        elif hasattr(raw, "reply"):
            output = raw.reply
        else:
            output = str(raw)

        if not output.strip():
            context.logger.error("[RecipeCreator] empty output")
            return response.text("⚠️ No recipe could be generated. Try a different query.")

        return response.text(output)

    except Exception as exc:
        context.logger.error(f"[RecipeCreator] fatal error: {exc}", exc_info=True)
        return response.text("❌ There was an internal error generating your recipe.")
