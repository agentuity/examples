from agentuity import AgentRequest, AgentResponse, AgentContext


async def run(request: AgentRequest, response: AgentResponse, context: AgentContext):
    data = request.data.json
    action = data.get("action")
    user_id = data.get("userId")
    preferences = data.get("preferences")

    if action == "get":
        # Retrieve user preferences
        result = await context.kv.get("user-preferences", user_id)

        if not result.exists:
            return response.json({"message": "No preferences found"})

        # Access the data from the result
        user_prefs = result.data.json

        return response.json({
            "message": "User preferences retrieved",
            "preferences": user_prefs
        })
    
    elif action == "set":
        # Store user preferences
        if not user_id or not preferences:
            return response.json({"error": "User ID and preferences are required"})

        # Store in key-value storage with 24-hour TTL
        await context.kv.set("user-preferences", user_id, preferences, {"ttl": 86400})

        return response.json({
            "message": "User preferences saved",
            "userId": user_id
        })
    
    elif action == "delete":
        # Delete user preferences
        if not user_id:
            return response.json({"error": "User ID is required"})

        await context.kv.delete("user-preferences", user_id)

        return response.json({
            "message": "User preferences deleted",
            "userId": user_id
        })
    
    else:
        return response.json({"error": 'Invalid action. Use "get", "set", or "delete".'})
