# Dynamic Tools

Demonstrates [LangChain's dynamic tool selection](https://docs.langchain.com/oss/javascript/langchain/agents#dynamic-tools) ported to Agentuity. Shows three approaches to controlling which tools an agent can use at runtime.

## What This Example Shows

### 1. Filter by State (Authentication + Message Count)

Enable/disable tools based on authentication status and conversation length:

```ts
const stateBasedTools = createMiddleware({
  name: "StateBasedTools",
  wrapModelCall: (request, handler) => {
    const isAuthenticated = request.state.authenticated ?? false;
    const messageCount = request.state.messages.length;

    let filteredTools = request.tools;
    if (!isAuthenticated) {
      filteredTools = request.tools.filter(t => t.name.startsWith("public_"));
    } else if (messageCount < 5) {
      filteredTools = request.tools.filter(t => t.name !== "advanced_search");
    }
    return handler({ ...request, tools: filteredTools });
  },
});
```

### 2. Filter by Runtime Context (User Role)

Filter tools based on user permissions:

```ts
const contextBasedTools = createMiddleware({
  name: "ContextBasedTools",
  wrapModelCall: (request, handler) => {
    const userRole = request.runtime.context.userRole;

    if (userRole === "admin") { /* all tools */ }
    else if (userRole === "editor") {
      filteredTools = request.tools.filter(t => t.name !== "delete_data");
    } else {
      filteredTools = request.tools.filter(t => t.name.startsWith("read_") || t.name.startsWith("public_"));
    }
    return handler({ ...request, tools: filteredTools });
  },
});
```

### 3. Conditional Visibility + Custom Execution

Track tool visibility across middleware layers and intercept specific tool calls with `wrapToolCall`:

```ts
const dynamicToolMiddleware = createMiddleware({
  name: "DynamicToolMiddleware",
  wrapModelCall: (request, handler) => {
    // Track which tools survived the previous middleware filters
    const hasTip = request.tools.some(t => t.name === "calculate_tip");
    return handler(request);
  },
  wrapToolCall: (request, handler) => {
    // Intercept specific tool calls for custom logging/behavior
    if (request.toolCall.name === "calculate_tip") {
      // e.g. add audit logging, metrics, etc.
    }
    return handler(request);
  },
});
```

## Tools Available

| Tool | Access Level | Description |
|------|-------------|-------------|
| `public_search` | Everyone | Search public information |
| `public_weather` | Everyone | Get weather data |
| `read_database` | Authenticated | Read database records |
| `write_database` | Editor, Admin | Write database records |
| `delete_data` | Admin only | Delete database records |
| `advanced_search` | Auth + 5 messages | Advanced filtered search |
| `calculate_tip` | Everyone | Calculate bill tips |

## API Endpoints

| Method | Endpoint    | Description                 |
| ------ | ----------- | --------------------------- |
| `POST` | `/api/chat` | Send a message to the agent |

### Request

```bash
# Unauthenticated viewer — only public tools
curl -X POST http://localhost:3500/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Search for AI news", "userRole": "viewer", "authenticated": false}'

# Authenticated admin — all tools
curl -X POST http://localhost:3500/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Delete record 5 from users table", "userRole": "admin", "authenticated": true}'

# Runtime tool (any role)
curl -X POST http://localhost:3500/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Calculate a 20% tip on $85"}'
```

## LangChain Pattern Mapping

| LangChain Pattern | Implementation |
|---|---|
| State-based filtering | `stateBasedTools` middleware checks `request.state` |
| Context-based filtering | `contextBasedTools` middleware checks `request.runtime.context` |
| `wrapModelCall` + `wrapToolCall` | `dynamicToolMiddleware` for visibility tracking + call interception |
| Composed middleware | Three layers: `[stateBasedTools, contextBasedTools, dynamicToolMiddleware]` |

## Development

```bash
bun dev        # Start development server at http://localhost:3500
bun run build  # Build for production
bun typecheck  # Run TypeScript type checking
```

## Project Structure

```
dynamic-tools/
├── src/
│   ├── agent/
│   │   └── dynamic-tools/
│   │       └── index.ts      # Agent + 3 middleware layers + 7 tools
│   ├── api/
│   │   └── index.ts          # Chat endpoint
│   └── web/
│       ├── App.tsx            # Chat UI with role/auth controls
│       ├── App.css            # Tailwind styles
│       ├── frontend.tsx       # React entry point
│       └── index.html         # HTML template
├── app.ts                     # Application entry point
└── package.json
```
