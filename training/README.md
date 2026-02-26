# Training Examples

Progressive tutorials for learning Agentuity, from a basic agent to recursive multi-agent research.

| Example | Concept | Key SDK Features |
|---------|---------|-----------------|
| [01-hello-world](./01-hello-world) | Agent basics | Schemas, KV storage, OpenAI |
| [02-weather-agent](./02-weather-agent) | External API integration | Response caching, AI SDK |
| [03-concierge](./03-concierge) | Multi-agent orchestration | Intent routing, conversation history |
| [04-storage-types](./04-storage-types) | Storage backends | Object storage, Vector storage, KV |
| [05-deep-research](./05-deep-research) | Recursive agent patterns | Web search, report generation |

## Getting Started

```bash
cd 01-hello-world
cp .env.example .env   # add your API keys
bun install
bun run dev
```

Each example includes setup instructions in its own README.

Start with `01-hello-world` if you're new — examples build on each other and later ones assume familiarity with earlier concepts.

## More Examples

For platform features (e.g., sandboxes, cron jobs) see [features/](../features).

For adding agents to an existing app (e.g., Next.js, TanStack Start) see [existing-apps/](../existing-apps).

For integrations with other SDKs (e.g., Mastra, LangChain) see [integrations/](../integrations).
