from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from enum import Enum


class AgentType(str, Enum):
    SANFRANCISCO = "sanfrancisco"
    CONFERENCE = "conference"
    AGENTUITY = "agentuity"
    OTHER = "other"


class UserIntent(BaseModel):
    agent_type: AgentType = Field(alias="agentType")
    tags: List[str]
    likely_intent: str = Field(alias="likelyIntent")
    negative_intent: str = Field(alias="negativeIntent")
    user_prompt: Optional[str] = Field(None, alias="userPrompt")

    class Config:
        populate_by_name = True


class ConversationRecord(BaseModel):
    user_intent: Optional[UserIntent] = Field(None, alias="userIntent")
    concierge_response: Optional[str] = Field(None, alias="conciergeResponse")
    agent_response: Optional[str] = Field(None, alias="agentResponse")
    conversation_id: str = Field(alias="conversationId")
    history: Optional[List[str]] = None

    class Config:
        populate_by_name = True


# Schema for OpenAI structured generation
USER_INTENT_SCHEMA = {
    "type": "object",
    "properties": {
        "agentType": {
            "type": "string",
            "enum": ["sanfrancisco", "conference", "agentuity"]
        },
        "tags": {
            "type": "array",
            "items": {"type": "string"}
        },
        "likelyIntent": {"type": "string"},
        "negativeIntent": {"type": "string"},
        "userPrompt": {"type": "string"}
    },
    "required": ["agentType", "tags", "likelyIntent", "negativeIntent"],
    "additionalProperties": False
}