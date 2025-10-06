from agentuity import AgentRequest, AgentResponse, AgentContext
from anthropic import AsyncAnthropic
import json
from common.prompts import SYSTEM_PROMPT

client = AsyncAnthropic()

def author_prompt(research):
    return f"""Generate a report based on the following research data:

{json.dumps(research, indent=2)}

Make sure to include the following sections:
- Summary
- Key Findings
- Recommendations
- Next Steps
- References
Write in markdown format."""

def welcome():
    return {
        "welcome": "Welcome to the Author Agent! I can generate comprehensive reports based on research data.",
        "prompts": [
            {
                "data": "Generate a report from research data",
                "contentType": "application/json"
            }
        ]
    }

async def run(request: AgentRequest, response: AgentResponse, context: AgentContext):
    try:
        research_data = await request.data.json()

        result = await client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=4096,
            system=SYSTEM_PROMPT,
            messages=[
                {
                    "role": "user",
                    "content": author_prompt(research_data),
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
