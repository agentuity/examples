import type { AgentRequest, AgentResponse, AgentContext } from "@agentuity/sdk";

export default async function handler(
  request: AgentRequest,
  response: AgentResponse,
  context: AgentContext,
) {
  try {
    // Start a telemetry span for the entire request
    const mainSpan = context.telemetry.startSpan('process-request');
    
    // Get the request data
    const data = request.data.json;
    const { query, userId } = data;
    
    // Record user information as attributes
    mainSpan.setAttribute('user.id', userId || 'anonymous');
    
    // Log the request
    context.logger.info(`Processing request for user: ${userId || 'anonymous'}`);
    
    // Start a child span for data processing
    const processSpan = context.telemetry.startSpan('process-data', { parent: mainSpan });
    
    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Record a counter metric for processed requests
    context.telemetry.counter('requests.processed').add(1, {
      'user.id': userId || 'anonymous',
      'request.type': 'query'
    });
    
    // End the processing span
    processSpan.end();
    
    // Start a span for generating response
    const responseSpan = context.telemetry.startSpan('generate-response', { parent: mainSpan });
    
    // Simulate response generation time
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Record response generation time
    context.telemetry.histogram('response.generation.time').record(50, {
      'user.id': userId || 'anonymous'
    });
    
    // End the response generation span
    responseSpan.end();
    
    // End the main span
    mainSpan.end();
    
    // Return the response
    return await response.json({
      message: `Processed query: ${query || 'No query provided'}`,
      timestamp: new Date().toISOString(),
      metrics: {
        totalProcessingTime: 150, // milliseconds
        steps: ['process-data', 'generate-response']
      }
    });
  } catch (error) {
    // Record error in telemetry
    context.telemetry.counter('errors').add(1, {
      'error.type': error instanceof Error ? error.name : 'unknown',
      'error.message': error instanceof Error ? error.message : 'Unknown error'
    });
    
    // Log the error
    context.logger.error('Error processing request', error);
    
    // Return error response
    return await response.json({
      error: 'Failed to process request',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
