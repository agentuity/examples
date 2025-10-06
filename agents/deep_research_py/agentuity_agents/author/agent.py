from agentuity import AgentRequest, AgentResponse, AgentContext
from anthropic import AsyncAnthropic

client = AsyncAnthropic()

def welcome():
    return {
        "welcome": "Welcome to the Anthropic Python Agent! I can help you build AI-powered applications using Claude models.",
        "prompts": [
            {
                "data": "How do I implement streaming responses with Claude models?",
                "contentType": "text/plain"
            },
            {
                "data": "What are the best practices for prompt engineering with Claude?",
                "contentType": "text/plain"
            }
        ]
    }

async def run(request: AgentRequest, response: AgentResponse, context: AgentContext):
    try:
        result = await client.messages.create(
            model="claude-3-7-sonnet-latest",
            max_tokens=1024,
            messages=[
                {
                    "role": "user",
                    "content": await request.data.text() or "Hello, Claude",
                }
            ],
        )

        if result.content[0].type == "text":
            return response.text(result.content[0].text)
        else:
            return response.text("Something went wrong")
    except Exception as e:
        context.logger.error(f"Error running agent: {e}")

        return response.text("Sorry, there was an error processing your request.")
