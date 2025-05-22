from agentuity import AgentRequest, AgentResponse, AgentContext
import json


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

        # Access the data
        user_prefs = result.data.json

        return response.json({"preferences": user_prefs})
    
    elif action == "set":
        # Store user preferences
        await context.kv.set(
            "user-preferences",
            user_id,
            preferences,
            {"ttl": 60 * 60 * 24 * 30}  # 30 days in seconds
        )

        return response.json({"message": "Preferences saved successfully!"})
    
    elif action == "delete":
        # Delete user preferences
        await context.kv.delete("user-preferences", user_id)
        
        return response.json({"message": "Preferences deleted successfully!"})
    
    else:
        return response.json({"error": 'Invalid action. Use "get", "set", or "delete".'})
