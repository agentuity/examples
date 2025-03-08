from agentuity import AgentRequest, AgentResponse, AgentContext
import json
from datetime import datetime


async def run(request: AgentRequest, response: AgentResponse, context: AgentContext):
    data = request.json()
    action = data.get("action")
    message = data.get("message")
    agent_id = data.get("agentId")

    if action == "send":
        # Send a message to another agent
        if not agent_id:
            return response.json({"error": "Agent ID is required"})

        if not message:
            return response.json({"error": "Message is required"})

        # Send message to the specified agent
        result = await context.agent.send(agent_id, {
            "message": message,
            "sender": context.agent.id,
            "timestamp": datetime.now().isoformat()
        })

        return response.json({
            "message": "Message sent successfully",
            "result": result
        })
    
    elif action == "broadcast":
        # Broadcast a message to all agents in the same project
        if not message:
            return response.json({"error": "Message is required"})

        # Broadcast message to all agents
        results = await context.agent.broadcast({
            "message": message,
            "sender": context.agent.id,
            "timestamp": datetime.now().isoformat()
        })

        return response.json({
            "message": "Broadcast sent successfully",
            "results": results
        })
    
    elif action == "receive":
        # This is a handler for receiving messages from other agents
        # The message is available in the request body
        data = request.json()
        
        context.logger.info(f"Received message from agent {data.get('sender')}: {data.get('message')}")
        
        # Process the received message
        return response.json({
            "message": "Message received and processed",
            "echo": data.get("message"),
            "receivedAt": datetime.now().isoformat()
        })
    
    else:
        return response.json({"error": 'Invalid action. Use "send", "broadcast", or "receive".'})
