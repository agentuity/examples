import type { AgentRequest, AgentResponse, AgentContext } from "@agentuity/sdk";

export default async function handler(
  request: AgentRequest,
  response: AgentResponse,
  context: AgentContext
) {
  const { action, message, agentId } = await request.data.json();

  switch (action) {
    case "send": {
      // Send a message to another agent
      if (!agentId) {
        return response.json({ error: "Agent ID is required" });
      }

      if (!message) {
        return response.json({ error: "Message is required" });
      }

      // Get the agent by ID
      const agent = await context.getAgent({ id: agentId });

      // Send message to the specified agent
      const result = await agent.run({
        data: {
          message,
          sender: context.agent.id,
          timestamp: new Date().toISOString(),
        },
      });

      return response.json({
        message: "Message sent successfully",
        result,
      });
    }
    case "broadcast": {
      // Broadcast a message to all agents in the same project
      if (!message) {
        return response.json({ error: "Message is required" });
      }

      // Broadcast message to all agents
      // Note: This implementation may need to be adjusted based on the actual API
      const results = await context.agent.broadcast({
        data: {
          message,
          sender: context.agent.id,
          timestamp: new Date().toISOString(),
        },
      });

      return response.json({
        message: "Broadcast sent successfully",
        results,
      });
    }
    case "receive": {
      // This is a handler for receiving messages from other agents
      const data = await request.data.json();

      context.logger.info(
        `Received message from agent ${data.sender}: ${data.message}`
      );

      // Process the received message
      return response.json({
        message: "Message received and processed",
        echo: data.message,
        receivedAt: new Date().toISOString(),
      });
    }
    default:
      return response.json({
        error: 'Invalid action. Use "send", "broadcast", or "receive".',
      });
  }
}
