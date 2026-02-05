# Using Tools with Agentuity

This example demonstrates how to use tools with agents in the Agentuity platform, inspired by the [Mastra "Using Tools" pattern](https://mastra.ai/docs/agents/using-tools).

## Overview

Agents use tools to call APIs, query databases, or run custom functions. Tools give agents capabilities beyond language generation by providing structured access to data and performing clearly defined operations.

This example shows how to implement the Mastra tool pattern using OpenAI's function calling feature within Agentuity agents.

## Agents in This Example

### Weather Agent (`src/agent/weather/`)

A simple agent that uses a single tool to fetch weather data:

- **Tool**: `get_weather` - Fetches current weather from open-meteo API
- **Usage**: Ask about weather in any location

```bash
curl -X POST http://localhost:3500/api/weather \
  -H "Content-Type: application/json" \
  -d '{"message": "What is the weather in London?"}'
```

### Activities Agent (`src/agent/activities/`)

An agent that uses multiple tools together:

- **Tool 1**: `get_weather` - Fetches current weather conditions
- **Tool 2**: `get_activities` - Suggests activities based on weather
- **Usage**: Ask for activity suggestions for any location

```bash
curl -X POST http://localhost:3500/api/activities \
  -H "Content-Type: application/json" \
  -d '{"message": "What should I do in Paris today?"}'
```

## How Tools Work

### Defining Tools

Tools are defined as OpenAI function calling specifications:

```typescript
const tools: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'get_weather',
      description: 'Fetches current weather for a location',
      parameters: {
        type: 'object',
        properties: {
          location: {
            type: 'string',
            description: 'The city or location to get weather for',
          },
        },
        required: ['location'],
      },
    },
  },
];
```

### Implementing Tool Functions

Each tool has a corresponding implementation function:

```typescript
async function getWeather(location: string): Promise<string> {
  const response = await fetch(`https://wttr.in/${encodeURIComponent(location)}?format=3`);
  return response.text();
}
```

### Using Tools in Agents

The agent handler orchestrates tool calls:

1. Send user message to LLM with available tools
2. LLM decides which tools to call (if any)
3. Execute tool calls and return results to LLM
4. LLM generates final response

## Project Structure

```
using-tools/
├── src/
│   ├── agent/
│   │   ├── weather/        # Single tool example
│   │   │   └── index.ts
│   │   └── activities/     # Multiple tools example
│   │       └── index.ts
│   ├── api/
│   │   └── index.ts        # API routes
│   └── web/                # React frontend
├── app.ts                  # Application entry point
└── package.json
```

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) v1.0 or higher
- OpenAI API key (set as `OPENAI_API_KEY` environment variable)

### Installation

```bash
bun install
```

### Development

```bash
bun dev
```

The server starts at `http://localhost:3500`

### Testing the Agents

**Weather Agent:**
```bash
curl -X POST http://localhost:3500/api/weather \
  -H "Content-Type: application/json" \
  -d '{"message": "What is the weather in Tokyo?"}'
```

**Activities Agent:**
```bash
curl -X POST http://localhost:3500/api/activities \
  -H "Content-Type: application/json" \
  -d '{"message": "Suggest activities for me in New York"}'
```

## Comparison with Mastra

| Mastra | Agentuity |
|--------|-----------|
| `createTool()` | OpenAI function calling tools |
| `inputSchema` (Zod) | `parameters` (JSON Schema) |
| `execute()` | Tool implementation function |
| `tools: { weatherTool }` | `tools` array passed to OpenAI |

While Mastra provides a dedicated `createTool` helper, Agentuity uses OpenAI's native function calling, giving you direct access to all OpenAI tool features including parallel tool calls and tool choice control.

## Learn More

- [Agentuity Documentation](https://agentuity.dev)
- [OpenAI Function Calling](https://platform.openai.com/docs/guides/function-calling)
- [Mastra Using Tools](https://mastra.ai/docs/agents/using-tools)
