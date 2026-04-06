# Basic Agent

Demonstrates [LangChain's core agent patterns](https://docs.langchain.com/oss/javascript/langchain/agents) ported to Agentuity. Shows how to create a ReAct agent with static tools, model configuration, and error handling middleware.

## What This Example Shows

### 1. Static Model Configuration

Initialize a `ChatOpenAI` model instance with explicit parameters:

```ts
import { ChatOpenAI } from "@langchain/openai";

const model = new ChatOpenAI({
  model: "gpt-5",
  temperature: 0.1,
  maxTokens: 1000,
  timeout: 30,
});
```

You can also use a model identifier string: `model: "openai:gpt-5"`.

### 2. Static Tools with Zod Schemas

Define tools using LangChain's `tool()` function with Zod schemas for input validation:

```ts
import { tool } from "langchain";
import * as z from "zod";

const search = tool(
  async ({ query }) => `Results for: ${query}`,
  {
    name: "search",
    description: "Search for information",
    schema: z.object({
      query: z.string().describe("The search query"),
    }),
  }
);
```

### 3. Tool Error Handling Middleware

Custom `wrapToolCall` middleware catches tool errors and returns a `ToolMessage` so the agent can recover:

```ts
import { createMiddleware, ToolMessage } from "langchain";

const handleToolErrors = createMiddleware({
  name: "HandleToolErrors",
  wrapToolCall: async (request, handler) => {
    try {
      return await handler(request);
    } catch (error) {
      return new ToolMessage({
        content: `Tool error: Please check your input and try again. (${error})`,
        tool_call_id: request.toolCall.id!,
      });
    }
  },
});
```

### 4. ReAct Loop

The agent follows the ReAct ("Reasoning + Acting") pattern:

```
1. User sends a question
2. Agent reasons about what tools to use
3. Agent calls tool(s) and receives observations
4. Agent uses observations to form a final answer
```

## API Endpoints

| Method | Endpoint    | Description                 |
| ------ | ----------- | --------------------------- |
| `POST` | `/api/chat` | Send a message to the agent |

### Example

```bash
curl -X POST http://localhost:3500/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What'\''s the weather in San Francisco?"}'
```

Response includes the final answer and a ReAct trace showing each step:

```json
{
  "response": "The weather in San Francisco is 62°F and foggy with coastal clouds.",
  "steps": [
    { "type": "human", "content": "What's the weather in San Francisco?" },
    { "type": "tool_call", "content": "Calling get_weather", "toolName": "get_weather", "toolArgs": "{\"location\":\"San Francisco\"}" },
    { "type": "tool_result", "content": "62°F, Foggy with coastal clouds", "toolName": "get_weather" },
    { "type": "ai", "content": "The weather in San Francisco is 62°F and foggy with coastal clouds." }
  ],
  "threadId": "...",
  "sessionId": "..."
}
```

## LangChain Pattern Mapping

| LangChain Pattern                    | Implementation                           |
| ------------------------------------ | ---------------------------------------- |
| `createAgent({ model, tools })`      | LangChain agent inside Agentuity handler |
| `new ChatOpenAI({ ... })`           | Model instance with config               |
| `tool(fn, { name, schema })`         | `search` and `get_weather` tools         |
| `createMiddleware({ wrapToolCall })` | `handleToolErrors` middleware            |
| `agent.invoke({ messages })`         | Called in Agentuity handler              |
| `ToolMessage`                        | Error recovery in wrapToolCall           |
| ReAct loop                           | Automatic via createAgent()              |

## Development

```bash
bun dev        # Start development server at http://localhost:3500
bun run build  # Build for production
bun typecheck  # Run TypeScript type checking
```

## Project Structure

```
basic-agent/
├── src/
│   ├── agent/
│   │   └── basic/
│   │       └── index.ts      # LangChain agent + tools + middleware
│   ├── api/
│   │   └── index.ts          # Chat endpoint
│   └── web/
│       ├── App.tsx            # Chat UI with ReAct trace
│       ├── App.css            # Tailwind styles
│       ├── frontend.tsx       # React entry point
│       └── index.html         # HTML template
├── app.ts                     # Application entry point
└── package.json
```
