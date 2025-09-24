from datetime import datetime
from agentuity import AgentRequest, AgentResponse, AgentContext
from openai import AsyncOpenAI

# Initialize OpenAI client (uses Agentuity's AI gateway)
client = AsyncOpenAI()

async def run(request: AgentRequest, response: AgentResponse, context: AgentContext):
    """A simple Hello World agent with AI-generated greetings that tracks statistics."""

    # Log the incoming request
    context.logger.info(f"Hello agent triggered via {request.trigger}")

    # Get request data
    try:
        if request.data.contentType == "application/json":
            data = await request.data.json()
            name = data.get("name", "World")
        elif request.data.contentType == "text/plain":
            name = await request.data.text() or "World"
        else:
            name = "World"
    except Exception as e:
        context.logger.error(f"Error parsing request: {e}")
        name = "World"

    # Generate greeting
    try:
        result = await client.chat.completions.create(
            model="gpt-5-nano",
            messages=[
                {
                    "role": "system",
                    "content": "You are a friendly assistant that creates unique, warm greetings. Keep responses to one sentence and be creative but appropriate."
                },
                {
                    "role": "user",
                    "content": f"Generate a friendly, unique greeting for someone named '{name}'"
                }
            ],
        )

        greeting = result.choices[0].message.content.strip()
        context.logger.info(f"AI-generated greeting for {name}")

    except Exception as e:
        context.logger.error(f"AI generation failed: {e}")
        greeting = f"Hello, {name}!"  # Fallback to simple greeting

    # Update greeting counter for this specific name
    name_key = f"greeting_count_{name}"
    counter_result = await context.kv.get("greetings", name_key)

    if counter_result.exists:
        data = await counter_result.data.json()
        current_count = data["count"]
        new_count = current_count + 1
    else:
        new_count = 1

    # Save updated counter with 24-hour TTL (86400 seconds)
    await context.kv.set("greetings", name_key, {"count": new_count}, {
        "ttl": 86400,
        "content_type": "application/json"
    })

    # Prepare response
    response_data = {
        "greeting": greeting,
        "personal_count": new_count
    }

    context.logger.info(f"Generated greeting #{new_count} for {name}")

    return response.json(response_data)


def welcome():
    """Provides welcome information when the agent is accessed via UI."""
    return {
        "welcome": "🤖 Hello World Agent - I create personalized greetings and track a counter!",
        "prompts": [
            {
                "data": {"name": "Alice"},
                "contentType": "application/json"
            },
            {
                "data": "Bob",
                "contentType": "text/plain"
            },
            {
                "data": {"name": "Dr. Smith"},
                "contentType": "application/json"
            }
        ]
    }
