import type { AgentRequest, AgentResponse, AgentContext } from "@agentuity/sdk";

export default async function AgentHandler(
  req: AgentRequest,
  resp: AgentResponse,
  ctx: AgentContext,
) {
  try {
    // Get the request data
    const data = req.json();
    const name = data.name || 'Guest';
    
    // Log the request
    ctx.logger.info(`Received greeting request for ${name}`);
    
    // Return a personalized greeting
    return resp.json({
      message: `Hello, ${name}! Welcome to Agentuity.`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    // Handle errors
    ctx.logger.error('Error processing request', error);
    
    return resp.json({ 
      error: 'Failed to process request',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
