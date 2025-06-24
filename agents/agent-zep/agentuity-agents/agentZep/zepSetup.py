"""
The function defined here is used to initialize Zep 
with some sample data that the user can play around with.

Taken from Zep docs. https://help.getzep.com/walkthrough
"""

import uuid
import json
from typing import Mapping, Sequence
from zep_cloud import Message

async def setup(zep):
    bot_name = "SupportBot"
    user_name = "Jane"
    user_id = user_name + str(uuid.uuid4())[:4]
    session_id = str(uuid.uuid4())

    await zep.user.add(
        user_id=user_id,
        email=f"{user_name}@painters.com",
        first_name=user_name,
        last_name="Painter",
        )

    await zep.memory.add_session(
        user_id=user_id,
        session_id=session_id,
        )
    support_cases = [
        {
            "subject": "Bug: Magic Pen Tool Drawing Goats Instead of Boats",
            "messages": [
                {
                    "role": "user",
                    "content": "Whenever I use the magic pen tool to draw boats, it ends up drawing goats instead.",
                    "timestamp": "2024-03-16T14:20:00Z",
                },
                {
                    "role": "support_agent",
                    "content": f"Hi {user_name}, that sounds like a bug! Thanks for reporting it. Could you let me know exactly how you're using the tool when this happens?",
                    "timestamp": "2024-03-16T14:22:00Z",
                },
                {
                    "role": "user",
                    "content": "Sure, I select the magic pen, draw a boat shape, and it just replaces the shape with goats.",
                    "timestamp": "2024-03-16T14:25:00Z",
                },
                {
                    "role": "support_agent",
                    "content": "Got it! We'll escalate this to our engineering team. In the meantime, you can manually select the boat shape from the options rather than drawing it with the pen.",
                    "timestamp": "2024-03-16T14:27:00Z",
                },
                {
                    "role": "user",
                    "content": "Okay, thanks. I hope it gets fixed soon!",
                    "timestamp": "2024-03-16T14:30:00Z",
                },
            ],
            "status": "escalated",
        },
    ]

    chat_history = [
        {
            "role": "assistant",
            "name": bot_name,
            "content": f"Hello {user_name}, welcome to PaintWiz support. How can I assist you today?",
            "timestamp": "2024-03-15T10:00:00Z",
        },
        {
            "role": "user",
            "name": user_name,
            "content": "I'm absolutely furious! Your AI art generation is completely broken!",
            "timestamp": "2024-03-15T10:02:00Z",
        },
        {
            "role": "assistant",
            "name": bot_name,
            "content": f"I'm sorry to hear that you're experiencing issues, {user_name}. Can you please provide more details about what's going wrong?",
            "timestamp": "2024-03-15T10:03:00Z",
        },
        {
            "role": "user",
            "name": user_name,
            "content": "Every time I try to draw mountains, your stupid app keeps turning them into fountains! And what's worse, all the people in my drawings have six fingers! It's ridiculous!",
            "timestamp": "2024-03-15T10:05:00Z",
        },
        {
            "role": "assistant",    
            "name": bot_name,
            "content": f"I sincerely apologize for the frustration this is causing you, {user_name}. That certainly sounds like a significant glitch in our system. I understand how disruptive this can be to your artistic process. Can you tell me which specific tool or feature you're using when this occurs?",
            "timestamp": "2024-03-15T10:06:00Z",
        },
        {
            "role": "user",
            "name": user_name,
            "content": "I'm using the landscape generator and the character creator. Both are completely messed up. How could you let this happen?",
            "timestamp": "2024-03-15T10:08:00Z",
        },
    ]

    transactions = [
        {
            "date": "2024-07-30",
            "amount": 99.99,
            "status": "Success",
            "account_id": user_id,
            "card_last_four": "1234",
        },
        {
            "date": "2024-08-30",
            "amount": 99.99,
            "status": "Failed",
            "account_id": user_id,
            "card_last_four": "1234",
            "failure_reason": "Card expired",
        },
        {
            "date": "2024-09-15",
            "amount": 99.99,
            "status": "Failed",
            "account_id": user_id,
            "card_last_four": "1234",
            "failure_reason": "Card expired",
        },
    ]

    account_status = {
        "user_id": user_id,
        "account": {
            "account_id": user_id,
            "account_status": {
                "status": "suspended",
                "reason": "payment failure",
            },
        },
    }

    def convert_to_zep_messages(chat_history: Sequence[Mapping[str, str | None]]) -> list[Message]:
        """
        Convert chat history to Zep messages.

        Args:
        chat_history (list): List of dictionaries containing chat messages.

        Returns:
        list: List of Zep Message objects.
        """
        return [
            Message(
                role_type=msg["role"],
                role=msg.get("name", None),
                content=msg["content"] or "",
            )
            for msg in chat_history
        ]

    # Zep's high-level API allows us to add a list of messages to a session.
    await zep.memory.add(
        session_id=session_id, messages=convert_to_zep_messages(chat_history)
    )

    # The lower-level data API allows us to add arbitrary data to a user's Knowledge Graph.
    for tx in transactions:
        await zep.graph.add(user_id=user_id, data=json.dumps(tx), type="json")

        await zep.graph.add(
            user_id=user_id, data=json.dumps(account_status), type="json"
        )

    for case in support_cases:
        await zep.graph.add(user_id=user_id, data=json.dumps(case), type="json")
