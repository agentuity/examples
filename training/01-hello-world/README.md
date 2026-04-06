# Hello World

A minimal agent that greets users by name, generates a unique greeting with an LLM, and tracks how many times each name has been greeted using KV storage.

## Prerequisites

- [Bun](https://bun.sh/) installed
- [Agentuity CLI](https://agentuity.dev/cli/installation) installed and logged in (`agentuity login`)

## Getting Started

```bash
bun install
bun run dev
```

Open [localhost:3500](http://localhost:3500) for the frontend, or [localhost:3500/workbench](http://localhost:3500/workbench) to test the agent directly.

## What's Inside

The `hello` agent takes a `name` as input, calls OpenAI to generate a creative one-sentence greeting, then reads and increments a per-name counter stored in KV. The counter resets after 24 hours via TTL:

```typescript
const counterResult = await ctx.kv.get('greetings', nameKey);

let newCount: number;
if (counterResult.exists && counterResult.data) {
  const data = counterResult.data as { count: number };
  newCount = data.count + 1;
} else {
  newCount = 1;
}

await ctx.kv.set('greetings', nameKey, { count: newCount }, {
  ttl: 86400,
  contentType: 'application/json',
});

return { greeting, personal_count: newCount };
```

Input and output shapes are declared with `@agentuity/schema`, which validates requests automatically and generates the workbench UI. The React frontend sends a name to `POST /api/hello` and renders the greeting text alongside the running count.

## Project Structure

```
src/
├── agent/hello/
│   ├── agent.ts      # LLM greeting + KV counter logic
│   └── index.ts
├── api/index.ts      # POST /api/hello
└── web/
    ├── App.tsx        # React UI with name input + greeting display
    ├── frontend.tsx   # Entry point
    └── index.html
```

## Related

- [Creating agents](https://agentuity.dev/agents/creating-agents)
- [Schema libraries](https://agentuity.dev/agents/schema-libraries)
- [KV storage](https://agentuity.dev/services/storage/key-value)
- [React hooks](https://agentuity.dev/frontend/react-hooks)
- [Agentuity SDK](https://github.com/agentuity/sdk)
