from agentuity import AgentRequest, AgentResponse, AgentContext
import json


async def run(request: AgentRequest, response: AgentResponse, context: AgentContext):
    data = request.json()
    action = data.get("action")
    user_id = data.get("userId")
    preferences = data.get("preferences")

    if action == "get":
        # Retrieve user preferences
        data = await context.kv.get("user-preferences", user_id)

        if not data:
            return response.json({"message": "No preferences found"})

        # Convert bytes to string and parse as JSON
        prefs_string = data.decode("utf-8")
        user_prefs = json.loads(prefs_string)

        return response.json({"preferences": user_prefs})
    
    elif action == "set":
        # Store user preferences
        await context.kv.set(
            "user-preferences",
            user_id,
            json.dumps(preferences),
            # Optional TTL (30 days in seconds)
            60 * 60 * 24 * 30
        )

        return response.json({"message": "Preferences saved successfully!"})
    
    elif action == "delete":
        # Delete user preferences
        await context.kv.delete("user-preferences", user_id)
        
        return response.json({"message": "Preferences deleted successfully!"})
    
    else:
        return response.json({"error": 'Invalid action. Use "get", "set", or "delete".'})
