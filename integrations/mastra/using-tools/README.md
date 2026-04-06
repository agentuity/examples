# Mastra Using Tools

Mastra agents calling tools to fetch live data, deployed on Agentuity.

## How It Works

**Mastra handles**: tool definitions (`createTool` with Zod schemas), agent orchestration (`Agent` with model + tools), and automatic tool calling via the LLM.

**Agentuity handles**: deployment, schema validation (`@agentuity/schema`), API routing, and the AI Gateway bridge so Mastra's `openai/gpt-5-nano` model string resolves through Agentuity's gateway.

## Architecture

```
using-tools/
├── src/
│   ├── agent/
│   │   ├── weather/         # Single-tool agent (get-weather)
│   │   │   └── index.ts
│   │   └── activities/      # Multi-tool agent (get-weather + get-activities)
│   │       └── index.ts
│   ├── api/
│   │   └── index.ts         # POST /weather, POST /activities
│   ├── lib/
│   │   └── gateway.ts       # AI Gateway bridge
│   └── web/                 # React frontend
├── app.ts
└── package.json
```

## Key Code Patterns

### Defining a Mastra tool

```typescript
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

const weatherTool = createTool({
  id: 'get-weather',
  description: 'Fetches current weather for a location',
  inputSchema: z.object({
    location: z.string().describe('City or location name'),
  }),
  execute: async ({ location }: { location: string }) => {
    const coords = await getCoordinates(location);
    const data = await fetch(`https://api.open-meteo.com/v1/forecast?...`);
    return `${coords.name}: Clear sky, 22°C`;
  },
});
```

### Creating a Mastra agent with tools

```typescript
import { Agent } from '@mastra/core/agent';

const weatherMastraAgent = new Agent({
  id: 'weather-agent',
  name: 'Weather Agent',
  instructions: 'You are a helpful weather assistant...',
  model: 'openai/gpt-5-nano',
  tools: { weatherTool },
});
```

### Wrapping in Agentuity for deployment

```typescript
import { createAgent } from '@agentuity/runtime';

const agent = createAgent('weather', {
  schema: { input: AgentInput, output: AgentOutput },
  handler: async (ctx, { message }) => {
    const result = await weatherMastraAgent.generate(message);
    return { response: result.text, tokens: (result.usage?.inputTokens ?? 0) + (result.usage?.outputTokens ?? 0) };
  },
});
```

## Commands

```bash
bun dev        # Start dev server at http://localhost:3500
bun run build  # Build for deployment
bun run deploy # Deploy to Agentuity
```

## Related

- [Mastra: Using Tools](https://mastra.ai/docs/agents/using-tools)
- [Agentuity Documentation](https://agentuity.dev)
