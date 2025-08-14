from agentuity import AgentRequest, AgentResponse, AgentContext
import asyncio
from agents.EmailAutoResponder.email_filter_crew import EmailFilterCrew
from agents.EmailAutoResponder.types import Email

def welcome():
    return {
        "welcome": "📧 I'm your Email Auto-Responder Crew. Send me email content and I'll analyze it, determine the appropriate action, and draft a response if needed.",
        "prompts": [
            "Process this email: [email content]",
            "Analyze and respond to: [email text]",
            "Handle this incoming email: [email body]"
        ]
    }

async def run(request: AgentRequest, response: AgentResponse, context: AgentContext):
    try:
        email_content = await request.data.text()
        context.logger.info(f"[EmailAutoResponder] Processing email: {email_content[:100]}...")
        
        email = Email(
            id="user_email",
            threadId="thread_001",
            subject="Email to process",
            snippet=email_content[:100] if len(email_content) > 100 else email_content,
            sender="user@example.com"
        )
        
        loop = asyncio.get_running_loop()
        crew = EmailFilterCrew()
        result = await loop.run_in_executor(
            None, 
            lambda: crew.crew().kickoff(inputs={"email": email.dict()})
        )
        
        return response.text(str(result))
    except Exception as e:
        context.logger.error(f"Error in EmailAutoResponder: {e}", exc_info=True)
        return response.text("❌ Something went wrong while processing your email.")
