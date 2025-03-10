from agentuity import AgentRequest, AgentResponse, AgentContext


async def run(request: AgentRequest, response: AgentResponse, context: AgentContext):
    try:
        # Get the request data
        data = request.data.json
        name = data.get("name", "Guest")
        
        # Log the request
        context.logger.info(f"Received greeting request for {name}")
        
        # Return a personalized greeting
        return response.json({
            "message": f"Hello, {name}! Welcome to Agentuity.",
            "timestamp": context.now().isoformat()
        })
    except Exception as e:
        # Handle errors
        context.logger.error(f"Error processing request: {str(e)}")
        
        return response.json({
            "error": "Failed to process request",
            "message": str(e)
        })
