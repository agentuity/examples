from agentuity import AgentRequest, AgentResponse, AgentContext
import asyncio

from agentuity_agents.MeetingSummarizer.meeting_summarizer import meeting_summarizer

def welcome():
    return {
        "welcome": "📝 I'm a Meeting Summarizer Agent. Paste your meeting transcript or provide an audio file and I'll extract key points, decisions, and action items!",
        "prompts": [
            {
                "data": "Please summarize this meeting transcript: [paste your transcript here]",
                "contentType": "text/plain"
            },
            {
                "data": "Extract action items from this meeting: [paste transcript]", 
                "contentType": "text/plain"
            }
        ]
    }

async def run(request: AgentRequest, response: AgentResponse, context: AgentContext):
    prompt = await request.data.text()
    context.logger.info(f"[MeetingSummarizer] prompt: {prompt!r}")

    try:
        loop = asyncio.get_running_loop()
        raw = await loop.run_in_executor(None, lambda: meeting_summarizer.run(prompt))

        if isinstance(raw, str):
            output = raw
        elif hasattr(raw, "content"):
            output = raw.content
        elif hasattr(raw, "reply"):
            output = raw.reply
        else:
            output = str(raw)

        if not output.strip():
            context.logger.error("[MeetingSummarizer] empty output")
            return response.text("⚠️ Summarizer produced no content.")

        return response.text(output)

    except Exception as exc:
        context.logger.error(f"[MeetingSummarizer] fatal error: {exc}", exc_info=True)
        return response.text("❌ An internal error occurred while summarizing the meeting.")
