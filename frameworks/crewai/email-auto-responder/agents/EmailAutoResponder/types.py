from pydantic import BaseModel

class Email(BaseModel):
    id: str
    threadId: str
    subject: str
    snippet: str
    sender: str
