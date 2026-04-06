# TanStack + Agentuity + Turborepo

A monorepo example demonstrating type-safe integration between TanStack frontend and Agentuity AI agents, orchestrated with Turborepo.

## Quick Start

```bash
bun install
bun run dev
```

Open http://localhost:3000 to use the translation app.

## Architecture

```
tanstack-turborepo/
├── apps/
│   ├── web/                 # TanStack frontend (port 3000)
│   │   └── src/components/TranslateDemo.tsx
│   └── agentuity/           # Agentuity backend (port 3500)
│       └── src/agent/translate/agent.ts
├── packages/
│   └── shared/              # Shared schemas & types
│       └── src/translate.ts
├── turbo.json               # Task orchestration
└── package.json             # Workspace root
```

## How It Works

### 1. Shared Schemas (`packages/shared`)

Define schemas once, use everywhere:

```typescript
// packages/shared/src/translate.ts
export const TranslateInputSchema = s.object({
  text: s.string(),
  toLanguage: s.enum(LANGUAGES).optional(),
  model: s.enum(MODELS).optional(),
});
```

### 2. Agent Uses Shared Schemas (`apps/agentuity`)

```typescript
// apps/agentuity/src/agent/translate/agent.ts
import { TranslateInputSchema, TranslateOutputSchema } from '@tanstack-turborepo/shared';

const agent = createAgent('translate', {
  schema: { input: TranslateInputSchema, output: TranslateOutputSchema },
  handler: async (ctx, { text, toLanguage, model }) => { ... }
});
```

### 3. Frontend Uses Shared Types (`apps/web`)

```typescript
// apps/web/src/components/TranslateDemo.tsx
import { LANGUAGES, type Language, type HistoryEntry } from '@tanstack-turborepo/shared';

const res = await fetch('/api/translate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ text, toLanguage, model }),
});
const data = await res.json();
```

### 4. Turborepo Orchestrates Everything

```bash
bun run dev    # Builds routes first, then runs both apps in parallel
bun run build  # Builds agentuity first (for route types), then web
```

## Commands

| Command | Description |
|---------|-------------|
| `bun run dev` | Start both frontend and backend |
| `bun run build` | Build all packages |
| `bun run typecheck` | Type-check all packages |

## Ports

- **Frontend**: http://localhost:3000
- **Agentuity Backend**: http://localhost:3500
- **Agent Workbench**: http://localhost:3500/workbench

## Type Safety Flow

1. Schemas defined in `packages/shared`
2. Agent uses shared schemas for input/output validation
3. Frontend imports shared types for request/response shapes
4. Single source of truth for types across the monorepo

## Deploying

The frontend and backend are independently deployable:

```bash
# Deploy just the agent
cd apps/agentuity && bun run deploy

# Build frontend for production
cd apps/web && bun run build
```

## Related

- [Schema libraries](https://agentuity.dev/agents/schema-libraries)
- [Project structure](https://agentuity.dev/get-started/project-structure)
- [Agentuity SDK](https://github.com/agentuity/sdk)
