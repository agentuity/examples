# Mastra Supervisor Agent

This example demonstrates how to use Mastra's multi-agent system within the Agentuity platform. The supervisor agent coordinates three specialized agents to create high-quality content:

1. **Copywriter Agent** - Creates initial content based on user prompts
2. **Editor Agent** - Refines and improves the content for quality and style
3. **Publisher Agent** - Supervises the process and provides final approval

## Features

- Multi-agent coordination using Mastra framework
- Sequential workflow: copywriter → editor → publisher
- Session persistence using Agentuity KV storage
- Comprehensive logging and error handling
- OpenAI GPT-4o integration for all agents

## Usage

### Local Development

1. Install dependencies:
   ```bash
   bun install
   ```

2. Start the development server:
   ```bash
   agentuity dev
   ```

3. Test the agent through the Agentuity console or make requests to the local endpoint.

### Example Prompts

- "Write a blog post about the benefits of AI in healthcare"
- "Create marketing copy for a new productivity app"
- "Draft an article about sustainable technology trends"

## Architecture

The supervisor agent implements the Agentuity wrapper pattern:

- `welcome()` function provides initial prompts and description
- `Agent()` function coordinates the three Mastra agents in sequence
- Each agent has specialized instructions and responsibilities
- Results are stored in KV storage for session persistence

## Dependencies

- `@mastra/core` - Core Mastra framework for agent creation
- `@ai-sdk/openai` - OpenAI integration for language models
- `@agentuity/sdk` - Agentuity platform integration

## Based On

This example is converted from the [Mastra Supervisor Agent](https://mastra.ai/en/examples/agents/supervisor-agent) documentation, adapted to work within the Agentuity platform while preserving all original functionality.
