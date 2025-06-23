import { z } from 'zod';
import { Agent, run as openaiRun, tool, RunState, RunResult } from '@openai/agents';
import type { AgentRequest, AgentResponse, AgentContext } from '@agentuity/sdk';

// Types
interface ApprovalRequest {
  type: 'approval';
  stateId: string;
  decisions: Array<{ approved: boolean }>;
}

interface InitialRequest {
  type?: string;
  message?: string;
}

interface ApprovalItem {
  id: string;
  agentName: string;
  toolName: string;
  arguments: Record<string, unknown>;
  message: string;
}

// Constants
const KV_NAMESPACE = 'agent-state';
const DEFAULT_QUESTION = 'What is the weather in Oakland and San Francisco?';

// Weather tool with approval logic
const weatherTool = tool({
  name: 'get_weather',
  description: 'Get the weather for a given city',
  parameters: z.object({
    location: z.string(),
  }),
  needsApproval: async (_context, { location }) => {
    return location === 'San Francisco';
  },
  execute: async ({ location }) => {
    return `The weather in ${location} is sunny`;
  },
});

// Agent configuration
const dataAgent = new Agent({
  name: 'Weather Data Agent',
  instructions: 'You are a specialized weather data agent that provides accurate weather information.',
  handoffDescription: 'Expert in weather data retrieval and analysis',
  tools: [weatherTool],
});

const mainAgent = new Agent({
  name: 'Weather Assistant',
  instructions: 'You are a helpful weather assistant that can get weather information for multiple cities.',
  handoffs: [dataAgent],
});

// Utility functions
function generateStateId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `approval_${timestamp}_${random}`;
}

function createErrorResponse(message: string, error?: unknown) {
  const response: { type: 'error'; message: string; error?: string } = {
    type: 'error' as const,
    message
  };
  if (error) {
    response.error = String(error);
  }
  return response;
}

function createCompletionResponse(output: unknown) {
  return {
    type: 'completion' as const,
    message: String(output),
    finalOutput: output
  };
}

// Main handler function
export default async function HumanInTheLoopAgent(
  request: AgentRequest,
  response: AgentResponse,
  context: AgentContext
) {
  try {
    const body = await request.data.json() as InitialRequest | ApprovalRequest | null;

    // Route based on request type
    if (body?.type === 'approval') {
      return await handleApprovalRequest(body as ApprovalRequest, response, context);
    }

    return await handleInitialRequest(body, response, context);

  } catch (error) {
    context.logger.error('Unexpected error in agent: %s', error);
    return response.json(createErrorResponse(
      'Sorry, there was an error processing your request.',
      error
    ));
  }
}

// Handle initial weather query
async function handleInitialRequest(
  body: InitialRequest | null,
  response: AgentResponse,
  context: AgentContext
) {
  // Extract user question with fallbacks
  const userQuestion = body?.message || DEFAULT_QUESTION;
  context.logger.info('Processing weather query: %s', userQuestion);

  // Start agent execution
  const result = await openaiRun(mainAgent, userQuestion);

  // Check if approval is needed
  if (result.interruptions?.length > 0) {
    return await handleInterruptions(result, response, context);
  }

  // Return completed result
  context.logger.info('Agent execution completed without interruptions');
  return response.json(createCompletionResponse(result.finalOutput));
}

// Handle interruptions that require approval
async function handleInterruptions(
  result: RunResult<any, Agent<any, any>>,
  response: AgentResponse,
  context: AgentContext
) {
  const stateId = generateStateId();

  try {
    // Store agent state
    const serializedState = result.state.toString();
    await context.kv.set(KV_NAMESPACE, stateId, serializedState);
    context.logger.info('Stored agent state with ID: %s', stateId);

    // Create approval requests
    const approvals: ApprovalItem[] = result.interruptions!.map((interruption, index) => ({
      id: `${stateId}_${index}`,
      agentName: interruption.agent.name,
      toolName: interruption.rawItem.name,
      arguments: (interruption.rawItem.arguments as unknown as Record<string, unknown>) || {},
      message: `Agent "${interruption.agent.name}" wants to use "${interruption.rawItem.name}" with: ${JSON.stringify(interruption.rawItem.arguments)}`
    }));

    return response.json({
      type: 'approval_needed',
      message: 'Agent execution paused - human approval required',
      stateId,
      approvals,
      instructions: 'Respond with: {"type": "approval", "stateId": "...", "decisions": [{"approved": true/false}]}'
    });

  } catch (error) {
    context.logger.error('Failed to handle interruptions: %s', error);
    return response.json(createErrorResponse('Failed to process approval request', error));
  }
}

// Handle approval response from user
async function handleApprovalRequest(
  body: ApprovalRequest,
  response: AgentResponse,
  context: AgentContext
) {
  const { stateId, decisions } = body;

  // Validate input
  if (!stateId || !decisions?.length) {
    return response.json(createErrorResponse('Invalid approval request: missing stateId or decisions'));
  }

  try {
    // Retrieve stored state
    const storedStateResult = await context.kv.get(KV_NAMESPACE, stateId);
    if (!storedStateResult?.data) {
      return response.json(createErrorResponse('Agent state not found - may have expired'));
    }

    context.logger.info('Retrieved agent state for approval processing');

    // Reconstruct agent state
    const stateString = await storedStateResult.data.text();
    const state = await RunState.fromString(mainAgent, stateString);

    // Get current interruptions
    let result = await openaiRun(mainAgent, state);

    // Apply user decisions
    if (result.interruptions) {
      result.interruptions.forEach((interruption, index) => {
        const decision = decisions[index];
        if (decision) {
          if (decision.approved) {
            context.logger.info('Approved: %s.%s', interruption.agent.name, interruption.rawItem.name);
            state.approve(interruption);
          } else {
            context.logger.info('Rejected: %s.%s', interruption.agent.name, interruption.rawItem.name);
            state.reject(interruption);
          }
        }
      });

      // Resume execution
      result = await openaiRun(mainAgent, state);

      // Check for additional approvals needed
      if (result.interruptions?.length > 0) {
        return await handleInterruptions(result, response, context);
      }
    }

    // Clean up and return final result
    await context.kv.delete(KV_NAMESPACE, stateId);
    context.logger.info('Agent execution completed after approval');

    return response.json(createCompletionResponse(result.finalOutput));

  } catch (error) {
    context.logger.error('Failed to process approval: %s', error);
    return response.json(createErrorResponse('Failed to process approval', error));
  }
}