# Mastra Soccer Workflow Agent

## Overview
The Soccer Workflow Agent demonstrates how to wrap a Mastra workflow within Agentuity's structure. This example preserves the original Mastra framework code while providing an Agentuity-compatible interface for fetching English Premier League match fixtures.

## How It Works
This agent wraps the original Mastra workflow from the [Mastra documentation](https://mastra.ai/en/examples/agents/using-a-workflow) that:

1. **Soccer Workflow**:
   - Fetches English Premier League fixtures for a given date
   - Uses The Sports DB API to retrieve match data
   - Returns structured fixture information including team names, match times, and dates
   - Follows the exact workflow pattern from the Mastra documentation

2. **Agentuity Wrapper**:
   - Preserves ALL original Mastra framework imports and functionality
   - Exports `welcome()` function with soccer-specific prompts
   - Exports default `AgentHandler()` function that wraps the Mastra workflow
   - Uses Mastra's `Agent` class and `Workflow` system exactly as shown in the original example
   - Handles errors with `ctx.logger` following Agentuity patterns

The wrapper demonstrates:
- Preserving original framework code intact (no replacement with vanilla code)
- Following Agentuity conventions for framework integrations
- Proper error handling and logging
- TypeScript integration with Agentuity SDK types

## Framework Preservation
This example maintains the original Mastra framework structure:
- **Workflow Definition**: `src/workflows/soccer-workflow.ts` contains the workflow adapted from Mastra docs using `Step` and `Workflow` classes
- **Agent Logic**: Uses Mastra's `Agent` class with original instructions and model configuration
- **Workflow Execution**: Uses Mastra's workflow execution pattern with `mastra.getWorkflow().createRun()`
- **Dependencies**: Includes all necessary Mastra packages (`@mastra/core`, `mastra`)
- **API Integration**: Preserves the original Sports DB API integration for Premier League fixtures

## Running Locally
To run this agent locally:

```bash
# Navigate to the agent directory
cd frameworks/mastra/soccer-workflow-agent

# Install dependencies
bun install

# Run the agent locally
agentuity dev
```

You can test the agent by sending prompts like:
- "What matches are being played this weekend?"
- "Show me today's Premier League fixtures"
- "What games are scheduled for tomorrow?"

## Deployment
To deploy this agent to Agentuity Cloud:

```bash
# Navigate to the agent directory
cd frameworks/mastra/soccer-workflow-agent

# Deploy the agent
agentuity deploy
```

After deployment, you can access your agent through the Agentuity Cloud dashboard.

## Framework Integration Pattern
This example follows the Agentuity framework integration pattern:
1. Import types from `@agentuity/sdk`
2. Preserve ALL original framework imports and setup
3. Export `welcome()` with message and prompts
4. Export default `Agent(req, resp, ctx)` that:
   - Extracts input from `req.data.text()`
   - Calls the original framework agent/functionality
   - Returns the result via `resp.text()`
   - Handles errors with try-catch + `ctx.logger`

## Additional Documentation
For more information about Agentuity and its capabilities, visit [https://agentuity.dev/](https://agentuity.dev/).
For more information about Mastra workflows, visit [https://mastra.ai/](https://mastra.ai/).
