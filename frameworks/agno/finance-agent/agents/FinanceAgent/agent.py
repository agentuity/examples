from agentuity import AgentRequest, AgentResponse, AgentContext
import asyncio

from agents.FinanceAgent.finance_agent import finance_agent

def welcome():
    return {
        "welcome": "💼 Ask about any public company—I'll give you a full market breakdown with news, financials, analyst insights, and more.",
    }

async def run(request: AgentRequest, response: AgentResponse, context: AgentContext):
    prompt = await request.data.text()
    context.logger.info(f"[FinanceAgent] prompt: {prompt!r}")

    try:
        loop = asyncio.get_running_loop()
        raw = await loop.run_in_executor(None, lambda: finance_agent.run(prompt))

        if isinstance(raw, str):
            output = raw
        elif hasattr(raw, "content"):
            output = raw.content
        elif hasattr(raw, "reply"):
            output = raw.reply
        else:
            output = str(raw)

        if not output.strip():
            context.logger.error("[FinanceAgent] empty output")
            return response.text("⚠️ Finance analysis produced no content.")

        return response.text(output)

    except Exception as exc:
        context.logger.error(f"[FinanceAgent] fatal error: {exc}", exc_info=True)
        return response.text("❌ An internal error occurred while analyzing the financial data.")
