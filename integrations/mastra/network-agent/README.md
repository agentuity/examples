# Mastra Network Agent

Multi-agent coordination using Mastra's `agents` property on the Agent constructor, with sub-agents for research and writing, deployed on Agentuity.

## How It Works

**Mastra handles**: agent-to-agent delegation via the `agents` config, tool calling (weather), and LLM routing decisions.

**Agentuity handles**: wrapping each agent for schema validation and deployment, conversation history via `ctx.thread.state` (20-message sliding window), and the AI Gateway bridge.

## Architecture

```
network-agent/
├── src/
│   ├── agent/
│   │   ├── network/
│   │   │   ├── index.ts      # Routing agent with sub-agents + tools
│   │   │   ├── tools.ts      # Weather tool (wttr.in API)
│   │   │   └── workflows.ts  # City workflow (research -> writing)
│   │   ├── research/
│   │   │   └── index.ts      # Research sub-agent (bullet points)
│   │   └── writing/
│   │       └── index.ts      # Writing sub-agent (full paragraphs)
│   ├── api/
│   │   └── index.ts          # Network, research, writing routes
│   ├── lib/
│   │   └── gateway.ts        # AI Gateway bridge
│   └── web/
├── app.ts
└── package.json
```

## Key Code Patterns

### Routing agent with sub-agents

```typescript
import { Agent } from '@mastra/core/agent';

const routingMastraAgent = new Agent({
  id: 'routing-agent',
  name: 'Network Routing Agent',
  instructions: 'You are a network of writers and researchers...',
  model: 'openai/gpt-4o-mini',
  agents: {
    researchAgent: researchMastraAgent,
    writingAgent: writingMastraAgent,
  },
  tools: { weatherTool },
});
```

### Conversation history via thread state

```typescript
const conversation = (await ctx.thread.state.get<Array<{ role: string; content: string }>>('conversation')) ?? [];
const messages = [
  ...conversation.map((m) => {
    if (m.role === 'user') return { role: 'user' as const, content: m.content };
    return { role: 'assistant' as const, content: m.content };
  }),
  { role: 'user' as const, content: message },
];
const result = await routingMastraAgent.generate(messages);

// Persist with 20-message sliding window
await ctx.thread.state.push('conversation', { role: 'user', content: message }, 20);
await ctx.thread.state.push('conversation', { role: 'assistant', content: response }, 20);
```

### Sub-agent definitions

```typescript
// Research agent: concise bullet-point insights
export const researchMastraAgent = new Agent({
  id: 'research-agent',
  name: 'Research Agent',
  instructions: 'Research the topic and provide key insights as bullet points...',
  model: 'openai/gpt-4o-mini',
});

// Writing agent: full-paragraph reports
export const writingMastraAgent = new Agent({
  id: 'writing-agent',
  name: 'Writing Agent',
  instructions: 'Transform research insights into well-structured content...',
  model: 'openai/gpt-4o-mini',
});
```

## API Endpoints

| Method | Endpoint             | Description                        |
| ------ | -------------------- | ---------------------------------- |
| `POST` | `/api/network`       | Route request through the network  |
| `POST` | `/api/research`      | Direct access to research agent    |
| `POST` | `/api/writing`       | Direct access to writing agent     |
| `GET`  | `/api/network/history` | Get conversation history         |

## Commands

```bash
bun dev        # Start dev server at http://localhost:3500
bun run build  # Build for deployment
bun run deploy # Deploy to Agentuity
```

## Related

- [Mastra: Agent Networks](https://mastra.ai/docs/agents/networks)
- [Agentuity Documentation](https://agentuity.dev)
