# Mastra Network Agent

Multi-agent coordination using Mastra's `agents` property on the Agent constructor, with sub-agents for research and writing, deployed on Agentuity.

## How It Works

**Mastra handles**: agent-to-agent delegation via the `agents` config, tool calling (weather), conversation memory (`Memory` + `LibSQLStore`), and LLM routing decisions.

**Agentuity handles**: wrapping each agent for schema validation and deployment, thread state for conversation persistence, and the AI Gateway bridge.

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
  memory,
});
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

### City workflow (research -> writing pipeline)

```typescript
export async function cityWorkflow(logger, { city }) {
  // Step 1: Research
  const researchResult = await researchMastraAgent.generate(
    `Research topic: ${city} - history, culture, landmarks, and interesting facts`
  );
  const insights = (researchResult.text ?? '')
    .split('\n')
    .map((line) => line.replace(/^[-•*]\s*/, '').trim())
    .filter((line) => line.length > 0);

  // Step 2: Write report from research
  const insightsList = insights.map((i) => `- ${i}`).join('\n');
  const writingPrompt = `Transform the following research insights into a well-structured report.\n\nTopic: ${city}\n\nResearch Insights:\n${insightsList}\n\nWrite in full paragraphs...`;
  const writingResult = await writingMastraAgent.generate(writingPrompt);
  const content = writingResult.text ?? '';
  const wordCount = content.split(/\s+/).length;

  return { city, research: { insights }, report: { content, wordCount } };
}
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
