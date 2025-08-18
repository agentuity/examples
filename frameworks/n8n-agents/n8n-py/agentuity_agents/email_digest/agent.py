from agentuity import AgentRequest, AgentResponse, AgentContext
from anthropic import AsyncAnthropic
import uuid

# Initialize clients
anthropic_client = AsyncAnthropic()

def welcome():
    return {
        "welcome": "Welcome to the Email Digest Agent! I process emails via Email IO and generate intelligent daily digests using AI.",
        "prompts": [
            {
                "data": "Generate my daily email digest",
                "contentType": "text/plain"
            }
        ]
    }

async def run(request: AgentRequest, response: AgentResponse, context: AgentContext):
    """
    Email Digest workflow implementation using Agentuity
    
    This agent processes emails via Email IO and generates intelligent digest summaries.
    """
    
    try:

        trigger = request.trigger

        # If we're getting an incoming email, we want to add it to our database for later reference.
        if trigger == "email":
            email = await request.data.email()
            context.logger.info(f"Email: {email}")
            if email:
                context.logger.info("Processing incoming email")
                email_text = f"Subject: {email.subject}\nFrom: {email.from_email}\nDate: {email.date}\nBody: {email.text}"
                
                # Store in Agentuity vector database
                await context.vector.upsert("email-digest", {
                    "key": str(uuid.uuid4()),
                    "document": email_text,
                    "metadata": {
                        "subject": email.subject,
                        "from": email.from_email,
                        "date": email.date,
                        "category": "email"
                    }
                })
                
                return response.text(f"📧 Email processed and stored successfully.\n\nSubject: {email.subject}\nFrom: {email.from_email}")
        
        # If we're triggering it from one of these sources, it means the agent needs to generate a digest.
        elif request.trigger in ["cron", "webhook", "manual"]:
            user_input = await request.data.text() or ""
            
            if "digest" in user_input.lower():
                # Generate digest from stored emails
                context.logger.info("Generating email digest")
                
                # Query recent emails from Agentuity vector store
                search_results = await context.vector.search("email-digest", {
                    "query": "recent emails",
                    "limit": 10
                })
                
                if not search_results or len(search_results) == 0:
                    return response.text("No recent emails found for digest generation.")
                
                # Format emails for digest generation
                email_summaries = []
                for result in search_results:
                    metadata = result.get("metadata", {})
                    content = result.get("document", "")
                    summary = f"Subject: {metadata.get('subject', 'No subject')}\n"
                    summary += f"From: {metadata.get('from', 'Unknown')}\n"
                    summary += f"Date: {metadata.get('date', 'Unknown')}\n"
                    summary += f"Content: {content[:300]}...\n"
                    email_summaries.append(summary)
                
                recent_emails = "\n---\n".join(email_summaries)
                
                # Generate digest using Anthropic Claude
                result = await anthropic_client.messages.create(
                    model="claude-3-haiku-20240307",
                    max_tokens=1500,
                    messages=[
                        {
                            "role": "user",
                            "content": f"You are generating a daily email digest. Create a well-structured summary of the provided emails.\n\nInclude:\n1. Key topics and themes\n2. Important messages that need attention\n3. Action items or follow-ups\n4. Brief summary of each significant email\n\nFormat it as a readable daily digest.\n\nEmails to process:\n{recent_emails}"
                        }
                    ]
                )
                
                if result.content[0].type == "text":
                    digest_content = result.content[0].text
                    context.logger.info("Generated daily digest successfully")
                    return response.text(f"📧 Daily Email Digest\n\n{digest_content}")
                else:
                    return response.text("Error generating digest")
            else:
                return response.text("No email data received. This agent processes emails via Email IO or generates digests when you type 'digest'.")
        
    except Exception as e:
        error_msg = f"Error processing request: {str(e)}"
        context.logger.error(error_msg)
        return response.text(f"Error: {error_msg}")

