from agentuity import AgentRequest, AgentResponse, AgentContext
from openai import AsyncOpenAI
import os
import uuid
from zep_cloud.client import AsyncZep
from zep_cloud import Message
from dotenv import load_dotenv, find_dotenv
import sys

# This is a helper function (from Zep docs) to seed the Zep database with information about a user.
sys.path.append(os.path.dirname(__file__))
from zepSetup import setup


load_dotenv(find_dotenv())

API_KEY = os.getenv("ZEP_API_KEY")
if not API_KEY:
    raise ValueError("ZEP_API_KEY environment variable is required")

client = AsyncOpenAI()

zep = AsyncZep(
    api_key=API_KEY
)

def welcome():
    return {
        "welcome": "Welcome to the Zep Agent! I will show you how you can use Zep in Agentuity.",
        "prompts": [
            {
                "data": {
                    "action": "seed",
                    "content":{ "text": "Run this to set up Zep with information about a test user, Jane Smith." }
                },
                "contentType": "application/json"
            },
            {
                "data": {
                    "action": "message",
                    "content":{
                        "user_id": "Jane536a",
                        "session_id": str(uuid.uuid4()),
                        "user_message": "Here you can send a message from Jane Smith, and Zep respond using what it knows about her!"
                    }
                },
                "contentType": "application/json"
            },
            { 
                "data": {
                    "action": "addUser",
                    "content": {
                        "user_id": "",
                        "user_first_name":"optional",
                        "user_last_name":"optional",
                        "user_email":"optional"
                    }
                },
                "contentType": "application/json"
            }

        ]
    }


async def run(request: AgentRequest, response: AgentResponse, context: AgentContext):
    data = await request.data.json()
    action = data["action"]
    # In this example, you can send a request with {"action": "seed"} to give Zep some data about Jane Painter, a customer.
    if action == "seed":
        await setup(zep)
        return response.text("Zep database seeded successfully.")

    # {"action": "message"} is used to send a message to the agent.
    elif action == "message":
        try:
            content = data["content"]
        except KeyError:
            return response.text("Missing 'content' in request.")

        # Try to get the session if it exists, otherwise add it.
        try:
            await zep.memory.get_session(session_id=content["session_id"])
        except Exception:
            try:
                await zep.memory.add_session(
                    user_id=content["user_id"],
                    session_id=content["session_id"],
                )
            except Exception as e:
                context.logger.error(f"Error finding/adding session: {e}")
                return response.text(f"Error finding/adding session: {e}")
        # Validate required fields
        required_fields = ["user_id", "session_id", "user_message"]
        for field in required_fields:
            if field not in content or not content[field]:
                return response.text(f"Missing or empty required field: {field}")

        # Add the user's message to Zep's memory.
        try:
            await zep.memory.add(
                session_id=content["session_id"],
                messages=[
                    Message(
                        role_type="user",
                        role=content["user_id"],
                        content=content["user_message"]
                    )
                ]
            )
        except Exception as e:
            context.logger.error(f"Error adding message to Zep memory: {e}")
            return response.text(f"Error adding message to memory: {e}")

        # Get the memory about the user (with info relevant to the session prioritized).
        try:
            memory = await zep.memory.get(session_id=content["session_id"])
        except Exception as e:
            context.logger.error(f"Error retrieving memory: {e}")
            return response.text(f"Error retrieving memory: {e}")

        messages = [
            {
                "role": "system",
                "content": (
                    "You are a people expert. You use the information you are "
                    "given about them to have a conversation with them."
                ),
            },
            {
                "role": "assistant",
                "content": memory.context or "",
            },
            {
                "role": "user",
                "content": content["user_message"],
            },
        ]

        # Generate a response from the agent.
        try:
            agent_response = await client.chat.completions.create(
                model="gpt-4o-mini",
                messages=messages,
                temperature=0,
            )
        except Exception as e:
            context.logger.error(f"Error generating OpenAI response: {e}")
            return response.text(f"Error generating response: {e}")

        # Add the agent's response to Zep's memory.
        try:
            await zep.memory.add(
                session_id=content["session_id"],
                messages=[
                    Message(
                        role_type="assistant",
                        role="assistant",
                        content=agent_response.choices[0].message.content or ""
                    )
                ]
            )
        except Exception as e:
            context.logger.error(f"Error storing response in Zep memory: {e}")
            # Continue since response was generated successfully

        return response.text(agent_response.choices[0].message.content or "Error generating response.")
    
    # {"action": "addUser"} is used to add a user to the Zep database.
    elif action == "addUser":
        try:
            content = data["content"]
        except KeyError:
            return response.text("Missing 'content' in request.")
        
        # Validate required user_id field
        if "user_id" not in content or not content["user_id"]:
            return response.text("Missing or empty required field: user_id")
        
        try:
            user = await zep.user.add(
                user_id=content["user_id"],
                first_name=content.get("user_first_name", ""),
                last_name=content.get("user_last_name", ""),
                email=content.get("user_email", "")
            )
            return response.text(f"User added successfully. User ID: {user.user_id}")
        except Exception as e:
            context.logger.error(f"Error adding user: {e}")
            return response.text(f"Error adding user: {e}")
    else:
        return response.text("Invalid action. Currently supported actions: ['seed', 'message', 'addUser']")
