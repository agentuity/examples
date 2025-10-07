# Mastra Calling Agents Example

This example demonstrates a Harry Potter-themed agent implemented using Mastra and wrapped for Agentuity. It's based on the [Calling Agents example](https://mastra.ai/en/examples/agents/calling-agents) from Mastra documentation.

## Overview

The agent implements Harry Potter's persona, responding to questions as if it were Harry himself. This demonstrates how to:
- Create a Mastra agent with custom instructions
- Wrap the Mastra agent in Agentuity's handler format
- Use the `@ai-sdk/openai` provider with Mastra
- Handle requests and responses through Agentuity's SDK

## Running Locally

1. Install dependencies:
   ```bash
   bun install
   ```

2. Run the agent in development mode:
   ```bash
   bun run dev
   ```

3. Test the agent:
   ```bash
   curl -X POST http://localhost:3500/agents/calling-agents \
     -H "Content-Type: text/plain" \
     -d "What is your favorite room in Hogwarts?"
   ```

## Calling Patterns

This agent can be called in multiple ways, similar to the original Mastra example:

1. **Via Agentuity REST API** (as shown above)
2. **Via Agentuity SDK** using `context.getAgent()`
3. **From other agents** using `resp.handoff()`

## Original Example

This is a conversion of Mastra's "calling-agents" example. The original demonstrates various ways to call Mastra agents including from workflow steps, tools, the Mastra Client SDK, and command line.

## Implementation Details

- **Framework**: Mastra Core v0.9.4+
- **Model**: OpenAI GPT-4o via @ai-sdk/openai
- **Runtime**: Bun
- **Platform**: Agentuity
