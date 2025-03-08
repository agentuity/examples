import type { AgentRequest, AgentResponse, AgentContext } from "@agentuity/sdk";

export default async function handler(
  request: AgentRequest,
  response: AgentResponse,
  context: AgentContext,
) {
  const { action, message, agentId } = request.json();

  switch (action) {
    case 'send': {
      // Send a message to another agent
      if (!agentId) {
        return response.json({ error: 'Agent ID is required' });
      }

      if (!message) {
        return response.json({ error: 'Message is required' });
      }

      // Send message to the specified agent
      const result = await context.agent.send(agentId, {
        message,
        sender: context.agent.id,
        timestamp: new Date().toISOString()
      });

      return response.json({
        message: 'Message sent successfully',
        result
      });
    }
    case 'broadcast': {
      // Broadcast a message to all agents in the same project
      if (!message) {
        return response.json({ error: 'Message is required' });
      }

      // Broadcast message to all agents
      const results = await context.agent.broadcast({
        message,
        sender: context.agent.id,
        timestamp: new Date().toISOString()
      });

      return response.json({
        message: 'Broadcast sent successfully',
        results
      });
    }
    case 'receive': {
      // This is a handler for receiving messages from other agents
      // The message is available in the request body
      const data = request.json();
      
      context.logger.info(`Received message from agent ${data.sender}: ${data.message}`);
      
      // Process the received message
      return response.json({
        message: 'Message received and processed',
        echo: data.message,
        receivedAt: new Date().toISOString()
      });
    }
    default:
      return response.json({ error: 'Invalid action. Use "send", "broadcast", or "receive".' });
  }
}
