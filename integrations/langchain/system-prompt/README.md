# System Prompt

Demonstrates [LangChain's system prompt patterns](https://docs.langchain.com/oss/javascript/langchain/agents#system-prompt) ported to Agentuity. Shows static prompts, dynamic prompt middleware, and custom state schemas.

## What This Example Shows

### 1. Static System Prompt

Base personality and instructions as a string:

```ts
const langchainAgent = createAgent({
  model,
  tools: [search, getDocumentation],
  systemPrompt: `You are a knowledgeable programming assistant called CodeHelper.
    You specialize in web development, TypeScript, and AI/LLM frameworks.`,
});
```

### 2. Dynamic Prompt Middleware

Middleware modifies the system message based on user expertise level:

```ts
const dynamicSystemPromptMiddleware = createMiddleware({
  name: "DynamicSystemPrompt",
  wrapModelCall: (request, handler) => {
    const expertiseLevel = request.runtime?.context?.expertiseLevel;

    let dynamicAddition = "";
    if (expertiseLevel === "expert") {
      dynamicAddition = "Be technical and concise. Skip basics.";
    } else if (expertiseLevel === "beginner") {
      dynamicAddition = "Use simple language. Break into steps.";
    }

    const messages = request.messages.map((m, i) => {
      if (i === 0 && m._getType?.() === "system") {
        return { ...m, content: m.content + dynamicAddition };
      }
      return m;
    });
    return handler({ ...request, messages });
  },
});
```

### 3. Custom State Schema (Memory)

Extend the default messages state with additional fields:

```ts
const AgentState = Annotation.Root({
  ...MessagesAnnotation.spec,
  userPreferences: Annotation<{
    expertiseLevel: "beginner" | "intermediate" | "expert";
    preferredLanguage: string;
    verbosity: "concise" | "detailed";
  }>({
    default: () => ({ expertiseLevel: "beginner", ... }),
  }),
});

const agent = createAgent({ model, stateSchema: AgentState, ... });
```

## API Endpoints

| Method | Endpoint    | Description                 |
| ------ | ----------- | --------------------------- |
| `POST` | `/api/chat` | Send a message to the agent |

### Request

```bash
# Beginner, detailed
curl -X POST http://localhost:3500/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What are React hooks?", "expertiseLevel": "beginner", "verbosity": "detailed"}'

# Expert, concise
curl -X POST http://localhost:3500/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "How does LangChain middleware work internally?", "expertiseLevel": "expert", "verbosity": "concise"}'
```

## LangChain Pattern Mapping

| LangChain Pattern | Implementation |
|---|---|
| Static `systemPrompt` | String passed to `createAgent()` |
| Dynamic prompt | `DynamicSystemPrompt` middleware modifies system message via `wrapModelCall` |
| Custom `stateSchema` | `Annotation.Root` extending `MessagesAnnotation` with `userPreferences` |
| Runtime context | Expertise + verbosity passed via `invoke()` config |

## Development

```bash
bun dev        # Start development server at http://localhost:3500
bun run build  # Build for production
bun typecheck  # Run TypeScript type checking
```

## Project Structure

```
system-prompt/
├── src/
│   ├── agent/
│   │   └── system-prompt/
│   │       └── index.ts      # Agent + dynamic prompt middleware + custom state
│   ├── api/
│   │   └── index.ts          # Chat endpoint
│   └── web/
│       ├── App.tsx            # Chat UI with expertise/verbosity controls
│       ├── App.css            # Tailwind styles
│       ├── frontend.tsx       # React entry point
│       └── index.html         # HTML template
├── app.ts                     # Application entry point
└── package.json
```
