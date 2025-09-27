from agentuity import AgentRequest, AgentResponse, AgentContext
from anthropic import AsyncAnthropic
import json
import random
from datetime import datetime
from typing import Dict, Any

from lib.types import UserIntent, ConversationRecord, AgentType, USER_INTENT_SCHEMA

client = AsyncAnthropic()

OVERALL_SYSTEM_PROMPT = """
You are a San Francisco concierge / host helping developers navigate San Francisco, the AI Engineer World Fair 2025 conference,
and developer related when it comes to building AI agents on top of Agentuity.
"""

def welcome():
    return {
        "welcome": """# Welcome to the AI Engineer World Fair 2025 Concierge

How can I help you today?  I can help you with:

- San Francisco information
- AI Engineer World Fair 2025 information
- Getting started with Agentuity

For example:

> Where should I go for dinner in San Francisco, tonight?

> What sessions about AI are happening today?

> Tell me more about [Speaker Name]'s background

> I'm hungry and looking for Cuban food near the conference

> Help me plan my schedule for tomorrow based on my interests

> What is Agentuity all about?

> What's the weather in San Francisco today?""",
        "prompts": [
            {
                "data": "Where should I go for dinner in San Francisco, tonight?",
                "contentType": "text/plain"
            },
            {
                "data": "What sessions about AI are happening today?",
                "contentType": "text/plain"
            },
            {
                "data": "Tell me more about Dillon Mulroy's background",
                "contentType": "text/plain"
            },
            {
                "data": "I'm hungry and looking for Cuban food near the conference",
                "contentType": "text/plain"
            },
            {
                "data": "Help me plan my schedule for tomorrow based on my interests",
                "contentType": "text/plain"
            },
            {
                "data": "What is Agentuity all about?",
                "contentType": "text/plain"
            },
            {
                "data": "What can I do?",
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

        # Create conversation record
        conversation = ConversationRecord(
            conversationId=f"{int(datetime.now().timestamp() * 1000)}_{random.randint(1000, 9999)}",
            history=[]
        )

        # Get past conversation from KV store
        try:
            past_conversation = await context.kv.get("concierge-history", "ai-engineer-world-fair-2025-dev-mode")
            if past_conversation and hasattr(past_conversation, 'data'):
                # Assuming past_conversation.data contains the history
                history_data = past_conversation.data
                if isinstance(history_data, list):
                    conversation.history = history_data
        except Exception as e:
            context.logger.info(f"No past conversation found or error retrieving it: {e}")
            conversation.history = []

        # Determine user's intent using structured generation
        intent_response = await client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=1000,
            system=f"""{OVERALL_SYSTEM_PROMPT} Apart from this, you serve as a central hub that routes user requests to the right available AI agents.
Your task is to determine the user's intent, tag anything relevant, determine the opposite of the user's intent (negative thinking)
to ensure we don't do that - so that we can handle the user's intent in a structured way), then select
the right agent for the use case.
Take the user's prompt and break these down according to the desired schema indicated.
The things you can help with by delegating to the right agent types are:
- Anytying related to San Francisco, surrounding areas, food, etc. (assume if a user is asking about
things like food, directions, etc. that they are looking for a local guide in San Francisco)
- The AI Engineer World Fair 2025 conference
- Developer related topics when it comes to building AI agents on top of Agentuity

You MUST respond with valid JSON that matches this exact schema:
{{
    "agentType": "sanfrancisco" | "conference" | "agentuity",
    "tags": ["tag1", "tag2", ...],
    "likelyIntent": "description of what user likely wants",
    "negativeIntent": "what we should avoid doing"
}}

Only respond with the JSON, no other text.
**CRITICAL**: Your response will be treated like this: \`intent_data = json.loads(intent_response.content[0].text)\`
So do not wrap in \`\`\`json or anything else.""",
            messages=[
                {
                    "role": "user",
                    "content": user_prompt
                }
            ]
        )


        try:
            intent_data = json.loads(intent_response.content[0].text)
            user_intent = UserIntent(**intent_data)
        except:
            return response.text("Failed to generate intent JSON.")
        
        user_intent.user_prompt = user_prompt
    
        conversation.user_intent = user_intent

        # Route to appropriate agent
        agent_type = user_intent.agent_type
        agent_name = None

        if agent_type == AgentType.SANFRANCISCO:
            agent_name = "SanFranLocalGuide"
        elif agent_type == AgentType.CONFERENCE:
            agent_name = "ConferenceExpert"
        elif agent_type == AgentType.AGENTUITY:
            agent_name = "DeveloperExperience"

        context.logger.info(f"Agent selected: {agent_name}")

        if agent_name:
            # Prepare message for sub-agent
            message = f"""
                <USER_INTENT>
                Here is the user's intent in stringified JSON: {json.dumps(user_intent.model_dump(by_alias=True))}
                </USER_INTENT>

                <HISTORY>
                For past context, here is the history of what the user has asked for. NOTE: only use this to
                understand the user, things they care about, etc. Do not use the history to answer the user's question.
                Here is the history: {chr(10).join(conversation.history or [])}
                </HISTORY>
            """

            # Get and run the agent
            agent = context.get_agent({"name":agent_name})
            result = await agent.run(message)
            agent_response = await result.data.text()
        else:
            agent_response = """
                There wasn't a specific area I can help with in your request.  I can help with things
                related to San Francisco, the AI Engineer World Fair 2025 conference, and developer related topics
                when it comes to building AI agents on top of Agentuity.
            """

        # Update conversation history
        history = [user_prompt]
        if conversation.history:
            history.extend(conversation.history)

        # Save to KV store
        try:
            await context.kv.set("concierge-history", "ai-engineer-world-fair-2025-dev-mode", history)
        except Exception as e:
            context.logger.error(f"Failed to save conversation history: {e}")

        return response.text(agent_response)

    except Exception as e:
        context.logger.error(f"Error running ConciergeHost agent: {e}")
        return response.text("Sorry, there was an error processing your request.")
