from agentuity import AgentRequest, AgentResponse, AgentContext  
import os  
import requests  
  
# Get API key from environment  
XAI_API_KEY = os.getenv("XAI_API_KEY")  
  
def welcome():  
    return {  
        "welcome": "Welcome to the X.AI News Agent! I can provide you with world news digests using Grok.",  
        "prompts": [  
            {  
                "data": "Provide me a digest of world news in the last 24 hours.",  
                "contentType": "text/plain"  
            },  
            {  
                "data": "What are the latest tech news updates?",  
                "contentType": "text/plain"  
            }  
        ]  
    }  
  
async def run(request: AgentRequest, response: AgentResponse, context: AgentContext):  
    try:  
        if not XAI_API_KEY:  
            context.logger.error("XAI_API_KEY environment variable not set")  
            return response.text("Error: XAI_API_KEY not configured")  
          
        # Get user input from request  
        user_content = await request.data.text() or "Provide me a digest of world news in the last 24 hours."  
        # X.AI API configuration  
        url = "https://api.x.ai/v1/chat/completions"  
        headers = {  
            "Content-Type": "application/json",  
            "Authorization": f"Bearer {XAI_API_KEY}"  
        }  
          
        # Create payload with user input  
        payload = {  
            "messages": [  
                {  
                    "role": "user",  
                    "content": user_content  
                }  
            ],  
            "search_parameters": {  
                "mode": "auto",  
                "return_citations": True  
            },  
            "model": "grok-3-latest"  
        }  
          
        # Send request to X.AI  
        api_response = requests.post(url, headers=headers, json=payload)  
        api_response.raise_for_status()  
          
        result = api_response.json()  
          
        # Extract the response content  
        if 'choices' in result and len(result['choices']) > 0:  
            content = result['choices'][0]['message']['content']  
            return response.text(content)  
        else:  
            return response.text("No response received from X.AI API")  
              
    except Exception as e:  
        context.logger.error(f"Error running X.AI agent: {e}")  
        return response.text("Sorry, there was an error processing your request.")