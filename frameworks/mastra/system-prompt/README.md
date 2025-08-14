# Mastra System Prompt Example

This example demonstrates how to use the Mastra framework with Agentuity to create an AI agent that uses system prompts for specialized behavior. The agent acts as a geography expert that provides interesting facts about cities.

## Overview

This agent wraps the original [Mastra system-prompt example](https://mastra.ai/en/examples/agents/system-prompt) within Agentuity's framework structure while preserving all the original Mastra functionality.

## Features

- **Geography Expert**: Specialized in providing interesting facts about cities
- **System Prompt**: Uses detailed instructions to define the agent's role and behavior
- **OpenAI Integration**: Leverages GPT-4o for generating responses
- **Error Handling**: Robust error handling with proper logging
- **Agentuity Integration**: Full integration with Agentuity's agent platform

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up your OpenAI API key:
```bash
agentuity env set OPENAI_API_KEY=<your-api-key>
```

3. Start the development server:
```bash
npm run dev
```

## Usage

The agent responds to queries about cities with interesting, lesser-known facts. Example queries:

- "Tell me an interesting fact about London"
- "What's a lesser-known fact about Tokyo?"
- "Share something fascinating about New York City"

## Architecture

The agent follows Agentuity's wrapper pattern:

1. **Imports**: Preserves all original Mastra imports (`@mastra/core/agent`, `@ai-sdk/openai`)
2. **Welcome Function**: Provides initial message and example prompts
3. **Agent Function**: Wraps the original Mastra Agent with Agentuity's interface
4. **Error Handling**: Uses Agentuity's logging system for proper error management

## Original Mastra Code

The core functionality is preserved from the original Mastra example:

```typescript
const cityAgent = new Agent({
  name: "city-agent",
  description: "Create facts for a city",
  instructions: "You are an expert in geography and travel. When given the name of a city, respond with one interesting, lesser-known fact about that city. Keep the response concise and factual.",
  model: openai("gpt-4o")
});
```

This demonstrates how Agentuity can wrap existing framework agents without modifying their core functionality.
