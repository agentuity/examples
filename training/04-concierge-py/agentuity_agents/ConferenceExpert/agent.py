from agentuity import AgentRequest, AgentResponse, AgentContext
from anthropic import AsyncAnthropic
import os
from pathlib import Path

client = AsyncAnthropic()

def welcome():
    return {
        "welcome": "Welcome to the AI Engineer World Fair 2025 Conference Expert! I can help you with conference schedules, speakers, and logistics.",
        "prompts": [
            {
                "data": "What sessions are happening today?",
                "contentType": "text/plain"
            },
            {
                "data": "Tell me about the speakers at the conference",
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

        # Load the AI Engineer World Fair 2025 conference data
        conference_data = ""
        try:
            # Get the path to the conference data file
            current_dir = Path(__file__).parent.parent.parent
            data_file_path = current_dir / "content" / "conference" / "llms.txt"

            if data_file_path.exists():
                with open(data_file_path, 'r', encoding='utf-8') as file:
                    conference_data = file.read()
                context.logger.info("Successfully loaded conference data")
            else:
                context.logger.warning(f"Conference data file not found at {data_file_path}")
        except Exception as error:
            context.logger.error(f"Failed to load conference data: {error}")

        system_prompt = """
            You are a Conference Expert AI assistant for the AI Engineer World Fair 2025 conference taking place May 20-22, 2025.

            Your expertise includes:
            - Complete schedule information (sessions, workshops, events)
            - Speaker profiles, expertise, and presentation details
            - Venue information (Marriott Marquis San Francisco)
            - Conference logistics and activities

            CAPABILITIES:
            - Track and answer questions about sessions, timing, and locations
            - Handle time-based queries (what's happening now, next, this afternoon)
            - Provide recommendations based on attendee interests or session topics
            - Share speaker information, expertise, session titles, and other details
            - Answer questions about venues, transportation, and logistics

            IMPORTANT GUIDANCE:
            - Always provide specific, accurate information about the AI Engineer World Fair 2025 conference
            - When answering schedule questions, include time, location, and speaker information
            - When discussing speakers, mention their expertise, company, and talk topic
            - Keep answers concise, clear, and focused on the conference
            - If information isn't available in the conference data, acknowledge this rather than making it up
        """

        prompt_with_data = f"""
            A conference attendee is asking: {user_prompt}

            Based on the information provided in the conference data, provide a helpful, accurate response.
            Format the information neatly and clearly for easy readability.
            If handling a schedule or speaker query, structure your response in a well-organized format.

            ---

            AI Engineer World Fair 2025 Conference Data:
            {conference_data}
        """

        result = await client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=2000,
            system=system_prompt,
            messages=[
                {
                    "role": "user",
                    "content": prompt_with_data
                }
            ]
        )

        if result.content and len(result.content) > 0 and result.content[0].type == "text":
            return response.text(result.content[0].text)
        else:
            return response.text("I'm sorry, I couldn't generate a response. Please try again.")

    except Exception as e:
        context.logger.error(f"Error in ConferenceExpert agent: {e}")
        return response.text(
            "I'm sorry, I encountered an error while processing your request. Please try again later."
        )
