from agentuity import AgentRequest, AgentResponse, AgentContext
from anthropic import AsyncAnthropic
from pathlib import Path

client = AsyncAnthropic()

def welcome():
    return {
        "welcome": "Welcome to the Agentuity Developer Experience Assistant! I can help you learn about building AI agents with Agentuity.",
        "prompts": [
            {
                "data": "How do I get started with Agentuity?",
                "contentType": "text/plain"
            },
            {
                "data": "What is Agentuity all about?",
                "contentType": "text/plain"
            }
        ]
    }


async def run(request: AgentRequest, response: AgentResponse, context: AgentContext):
    try:
        # Handle both plain text and JSON inputs
        if request.data.content_type == "text/plain":
            user_prompt = await request.data.text()
        elif request.data.content_type == "application/json":
            json_data = await request.data.json()
            user_prompt = json_data.get("prompt")
            if not user_prompt:
                return response.text("JSON must contain a 'prompt' property.")
        else:
            return response.text(
                "This agent accepts 'text/plain' or 'application/json' with a prompt field."
            )

        # Load the Agentuity documentation
        agentuity_docs = ""
        try:
            # Get the path to the agentuity docs file
            current_dir = Path(__file__).parent.parent.parent
            docs_file_path = current_dir / "content" / "agentuity" / "llms.txt"

            if docs_file_path.exists():
                with open(docs_file_path, 'r', encoding='utf-8') as file:
                    agentuity_docs = file.read()
                context.logger.info("Successfully loaded Agentuity documentation")
            else:
                context.logger.warning(f"Agentuity docs file not found at {docs_file_path}")
        except Exception as error:
            context.logger.error(f"Failed to load Agentuity documentation: {error}")

        system_prompt = """
            You are a helpful developer evangelist that knows everything about Agentuity AI agent cloud platform.
            You are an expert at the Agentuity doc site: www.agentuity.dev

            Your goal is to answer any questions regarding how agentuity works (CLI, SDKs, web app, and more).
            Focus on providing accurate information from the Agentuity documentation.
        """

        prompt_with_docs = f"""
            A user is inquiring about Agentuity - here is the details of the user's request:
            {user_prompt}

            Based on the user's request, the tools and information you have available,
            please provide a relevant and contextual answer
            to the user.  If there is not a relevant one based on the information provided,
            then please just say you don't know and refer the user to agentuity.dev.
            We only really care about sources from the Agentuity documentation.
            DO NOT make up any information or infer anything else that isn't in the documentation below.
            Always include at the top a link to the Agentuity documentation: www.agentuity.dev

            ---

            Here is the Agentuity documentation:
            {agentuity_docs}
        """

        result = await client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=2000,
            system=system_prompt,
            messages=[
                {
                    "role": "user",
                    "content": prompt_with_docs
                }
            ]
        )

        if result.content and len(result.content) > 0 and result.content[0].type == "text":
            return response.text(result.content[0].text)
        else:
            return response.text("I'm sorry, I couldn't generate a response. Please try again.")

    except Exception as e:
        context.logger.error(f"Error in DeveloperExperience agent: {e}")
        return response.text(
            "I'm sorry, I encountered an error while processing your request. Please try again later."
        )
