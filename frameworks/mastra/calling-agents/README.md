# Mastra Calling Agents Example

This example demonstrates the Mastra calling-agents pattern converted to work with the Agentuity platform. It showcases a Harry Potter themed agent that responds as the famous wizard character, discussing Hogwarts, magic, and adventures.

## Overview

This project is based on the [Mastra calling-agents example](https://mastra.ai/en/examples/agents/calling-agents) which demonstrates different ways to interact with agents created using the Mastra framework. The original example shows how to call agents using workflow steps, tools, the Mastra Client SDK, and the command line.

In this Agentuity adaptation, we've wrapped the core Mastra agent functionality within Agentuity's SDK interfaces while preserving the original framework's capabilities.

## Features

- **Harry Potter Character Agent**: Responds as Harry Potter, discussing Hogwarts, friends, and magical adventures
- **Mastra Framework Integration**: Uses `@mastra/core/agent` for AI agent functionality
- **OpenAI Integration**: Powered by `gpt-4o-mini` model via `@ai-sdk/openai`
- **Agentuity SDK Wrapper**: Implements standard Agentuity interfaces for seamless platform integration

## Getting Started

### Prerequisites

- Bun runtime
- Agentuity CLI
- OpenAI API key (handled automatically via Agentuity Gateway)

### Installation

1. Install dependencies:
```bash
bun install
```

2. Start the development server:
```bash
agentuity dev
```

3. The agent will be available at the local development URL (typically `http://127.0.0.1:3500`)

### Usage

#### Welcome Endpoint

Visit the `/welcome` endpoint to see the agent's introduction and example prompts:

```bash
curl http://127.0.0.1:3500/welcome
```

Expected response:
```json
{
  "welcome": "Hello! I'm Harry Potter. Ask me about Hogwarts, magic, or my adventures!",
  "prompts": [
    {
      "data": "What is your favorite room in Hogwarts?",
      "contentType": "text/plain"
    },
    {
      "data": "Tell me about your friends Ron and Hermione.",
      "contentType": "text/plain"
    }
  ]
}
```

#### Interacting with the Agent

Send POST requests to interact with Harry Potter:

```bash
curl -X POST http://127.0.0.1:3500/agents/harryPotterAgent \
  -H "Content-Type: text/plain" \
  -d "What is your favorite room in Hogwarts?"
```

## Project Structure

```
frameworks/mastra/calling-agents/
├── src/
│   └── agents/
│       └── harryPotterAgent/
│           └── index.ts          # Main agent implementation
├── .cursor/
│   └── rules/                    # Development guidelines
├── agentuity.yaml               # Agentuity configuration
├── package.json                 # Dependencies and scripts
├── tsconfig.json               # TypeScript configuration
├── biome.json                  # Code formatting rules
├── index.ts                    # Bootstrap file
└── README.md                   # This file
```

## Implementation Details

The agent implementation follows the Agentuity pattern:

- **Welcome Function**: Provides initial greeting and example prompts
- **Default Handler**: Processes user input through Mastra's Agent class
- **Error Handling**: Uses Agentuity's context logger for proper error reporting
- **Framework Integration**: Preserves Mastra's agent functionality within Agentuity's interface

## Dependencies

- `@agentuity/sdk`: Agentuity platform integration
- `@mastra/core`: Core Mastra framework functionality
- `@ai-sdk/openai`: OpenAI model integration
- `ai`: AI SDK utilities
- `mastra`: Mastra framework

## Related Examples

- [Mastra Basic](../basic/) - Simple Mastra agent example
- [Mastra Multi-step Workflow](../multi-step-workflow/) - Complex workflow example
- [Original Mastra Calling Agents](https://mastra.ai/en/examples/agents/calling-agents) - Source example

## Development

To modify the agent behavior, edit `src/agents/harryPotterAgent/index.ts`. The agent uses the Mastra Agent class with Harry Potter character instructions.

For local development:
```bash
bun run dev
```

For production deployment:
```bash
agentuity deploy
```
