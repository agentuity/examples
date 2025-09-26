# Mastra System Prompt Example - Agentuity Wrapper

This example demonstrates how to wrap a Mastra agent that uses system prompts within Agentuity's structure. The agent implements a Harry Potter character agent that can respond as different characters from the wizarding world.

## Overview

This is a direct conversion of the [Mastra system-prompt example](https://mastra.ai/en/examples/agents/system-prompt) into an Agentuity agent wrapper. The implementation preserves ALL original Mastra framework code while adding Agentuity's wrapper structure.

## Features

- **Character-based responses**: The agent can respond as Harry Potter, Hermione Granger, or Ron Weasley
- **System prompt demonstration**: Shows how Mastra's system prompts can change agent behavior
- **Preserved framework code**: All original Mastra Agent creation and configuration is maintained
- **Agentuity integration**: Proper error handling, logging, and response formatting

## How it Works

The agent uses Mastra's `Agent` class with system prompts to define character personalities and response styles. When a user makes a request, the agent:

1. Receives input through Agentuity's `AgentRequest`
2. Creates a Mastra `Agent` with character-specific instructions
3. Generates a response using the original Mastra framework
4. Returns the result through Agentuity's `AgentResponse`

## Usage Examples

- "Speak as Harry Potter and tell me about your first day at Hogwarts"
- "Respond as Hermione and explain the importance of studying"
- "Answer as Ron and describe your favorite Quidditch match"

## Framework Preservation

This wrapper maintains the original Mastra framework patterns:

- Uses `@mastra/core/agent` for agent creation
- Preserves the original `Agent` constructor with `name`, `model`, and `instructions`
- Keeps the original `agent.generate()` method call
- Maintains all Mastra-specific configuration and behavior

## Development

```bash
# Install dependencies
bun install

# Run locally
agentuity dev

# Build
agentuity build

# Lint
bun run lint

# Format
bun run format
```

## Dependencies

- `@mastra/core`: Core Mastra framework
- `@ai-sdk/anthropic`: Anthropic AI SDK for Claude models
- `@agentuity/sdk`: Agentuity SDK for wrapper functionality

This example demonstrates the proper way to wrap existing framework agents in Agentuity structure without modifying the original framework code.
