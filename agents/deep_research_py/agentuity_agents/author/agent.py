from agentuity import AgentRequest, AgentResponse, AgentContext
from anthropic import AsyncAnthropic
import json
from common.prompts import SYSTEM_PROMPT

client = AsyncAnthropic()

def author_prompt(research):
    try:
        research_json = json.dumps(research, indent=2)
    except (TypeError, ValueError) as e:
        print(f"JSON encoding error in author_prompt: {e}")
        print(f"research type: {type(research)}")
        print(f"research: {research}")
        raise

    return f"""Generate a report based on the following research data:

{research_json}

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
        try:
            research_data = await request.data.json()
        except Exception as e:
            print(f"ERROR in author run() parsing request.data.json(): {e}")
            print(f"Error type: {type(e).__name__}")
            try:
                raw = await request.data.text()
                print(f"Request text: {raw[:500]}")
            except Exception as text_err:
                print(f"Could not get text: {text_err}")
            return response.text(f"Invalid JSON in request: {e}")

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
