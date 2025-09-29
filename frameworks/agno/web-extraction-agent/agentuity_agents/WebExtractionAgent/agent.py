from agentuity import AgentRequest, AgentResponse, AgentContext
import asyncio
import json

from agentuity_agents.WebExtractionAgent.web_extraction_agent import web_extraction_agent


def welcome():
    return {
        "welcome": "🔍 I can extract comprehensive, structured information from any webpage. Just provide a URL and I'll analyze the content, structure, and metadata for you!",
        "prompts": [
            {"data": "Extract information from https://www.agno.com", "contentType": "text/plain"},
            {"data": "Analyze the content and structure of https://docs.agno.com", "contentType": "text/plain"},
            {"data": "Get detailed information from https://github.com/agno-agi/agno", "contentType": "text/plain"}
        ]
    }


async def run(request: AgentRequest, response: AgentResponse, context: AgentContext):
    prompt = await request.data.text()
    context.logger.info(f"[WebExtractionAgent] prompt: {prompt!r}")

    try:
        loop = asyncio.get_running_loop()
        raw = await loop.run_in_executor(None, lambda: web_extraction_agent.run(prompt))

        if isinstance(raw, str):
            output = raw
        elif hasattr(raw, "content"):
            output = raw.content
        elif hasattr(raw, "reply"):
            output = raw.reply
        else:
            output = str(raw)

        if not output.strip():
            context.logger.error("[WebExtractionAgent] empty output")
            return response.text("⚠️ No information could be extracted. Please check the URL and try again.")

        try:
            parsed_output = json.loads(output) if isinstance(output, str) else output
            return response.json(parsed_output)
        except (json.JSONDecodeError, TypeError):
            return response.text(output)

    except Exception as exc:
        context.logger.error(f"[WebExtractionAgent] fatal error: {exc}", exc_info=True)
        return response.text("❌ There was an internal error extracting web information.")
