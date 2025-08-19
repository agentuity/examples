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

        # Handle incoming email - store for later digest generation
        if trigger == "email":
            email = await request.data.email()
            context.logger.info(f"Email: {email}")
            if email:
                context.logger.info("Processing incoming email")
                # Format email content for storage
                email_text = f"Subject: {email.subject}\nFrom: {email.from_email}\nDate: {email.date}\nBody: {email.text[:50]}..."
                
                # Filter out promotional emails and spam using LLM (you can tune the prompt to suit your needs!)
                filter_result = await anthropic_client.messages.create(
                    model="claude-3-haiku-20240307",
                    max_tokens=10,
                    messages=[
                        {
                            "role": "user",
                            "content": f"Should this email be included in a daily digest? Respond only with 'yes' or 'no'. Exclude promotional emails, spam, newsletters, and automated notifications.\n\nSubject: {email.subject}\nFrom: {email.from_email}\nBody: {email.text}"
                        }
                    ]
                )
                
                should_include = filter_result.content[0].text.strip().lower()
                if should_include != "yes":
                    context.logger.info(f"Email filtered out: {email.subject}")
                    return response.text(f"📧 Email filtered out (promotional/spam).\n\nSubject: {email.subject}\nFrom: {email.from_email}")

                # Store in Agentuity vector database
                await context.vector.upsert("n8n-email-digest", [
                    {
                    "key": str(uuid.uuid4()),
                    "document": email_text,
                    "metadata": {
                        "subject": email.subject,
                        "from": email.from_email,
                        "body": email.text,
                        "date": email.date.isoformat() if email.date else None,
                        "category": "email"
                    }
                }])
                
                return response.text(f"📧 Email processed and stored successfully.\n\nSubject: {email.subject}\nFrom: {email.from_email}")
        
        # Handle digest generation triggers
        elif request.trigger in ["cron", "webhook", "manual"]:
            user_input = await request.data.text() or ""
            
            if "digest" in user_input.lower():
                # Generate digest from stored emails
                context.logger.info("Generating email digest")
                
                # Retrieve recent emails from vector database
                search_results = await context.vector.search("n8n-email-digest", 
                    query="recent emails",
                    limit=5,
                    similarity=0.7,
                    metadata={"category": "email"}
                )
                
                if not search_results or len(search_results) == 0:
                    return response.text("No recent emails found for digest generation.")
                
                # Prepare email data for AI processing
                email_summaries = []
                # Track keys for cleanup after digest generation
                keys_to_delete=[]
                # Extract and format email metadata
                for result in search_results:
                    metadata = result.metadata
                    summary = f"Subject: {metadata["subject"]}\n"
                    summary += f"From: {metadata["from"]}\n"
                    summary += f"Date: {metadata["date"]}\n"
                    summary += f"Content: {metadata["body"]}\n"
                    
                    keys_to_delete.append(result.key)
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

                    # Clean up processed emails from vector store (if we're in production)
                    if not context.devmode:
                        for key in keys_to_delete:
                            try:
                                num = await context.vector.delete("n8n-email-digest", key)
                                context.logger.info(num)
                            except:
                                context.logger.error(f"Failed to delete element with key: {key}")

                    return response.text(f"📧 Daily Email Digest\n\n{digest_content}")
                else:
                    return response.text("Error generating digest")
            else:
                return response.text("No email data received. This agent processes emails via Email IO or generates digests when you type 'digest'.")
        
    except Exception as e:
        error_msg = f"Error processing request: {str(e)}"
        context.logger.error(error_msg)
        return response.text(f"Error: {error_msg}")

