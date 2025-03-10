from agentuity import AgentRequest, AgentResponse, AgentContext
from datetime import datetime


async def run(request: AgentRequest, response: AgentResponse, context: AgentContext):
    data = request.data.json
    action = data.get("action")
    message = data.get("message")
    agent_id = data.get("agentId")

    if action == "send":
        # Send a message to another agent
        if not agent_id:
            return response.json({"error": "Agent ID is required"})

        if not message:
            return response.json({"error": "Message is required"})

        # Send message to the specified agent using handoff
        result = await response.handoff(
            {"id": agent_id},
            {
                "message": message,
                "sender": context.agent.id,
                "timestamp": datetime.now().isoformat()
            }
        )

        return result
    
    elif action == "broadcast":
        # Broadcast a message to all agents in the same project
        if not message:
            return response.json({"error": "Message is required"})

        # Get all agents in the project
        agents = context.agents
        results = []

        # Send message to each agent using handoff
        for agent in agents:
            # Skip sending to self
            if agent.id == context.agent.id:
                continue
                
            try:
                # Send message to the agent
                await response.handoff(
                    {"id": agent.id},
                    {
                        "message": message,
                        "sender": context.agent.id,
                        "timestamp": datetime.now().isoformat()
                    }
                )
                results.append({"agent": agent.id, "status": "success"})
            except Exception as e:
                results.append({"agent": agent.id, "status": "error", "error": str(e)})

        return response.json({
            "message": "Broadcast sent successfully",
            "results": results
        })
    
    elif action == "receive":
        # This is a handler for receiving messages from other agents
        data = request.data.json
        
        context.logger.info(f"Received message from agent {data.get('sender')}: {data.get('message')}")
        
        # Process the received message
        return response.json({
            "message": "Message received and processed",
            "echo": data.get("message"),
            "receivedAt": datetime.now().isoformat()
        })
    
    else:
        return response.json({"error": 'Invalid action. Use "send", "broadcast", or "receive".'})
