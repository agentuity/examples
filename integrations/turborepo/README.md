# TanStack + Agentuity + Turborepo

A monorepo example demonstrating type-safe integration between TanStack frontend and Agentuity AI agents, orchestrated with Turborepo.

## Quick Start

```bash
# Install dependencies
bun install

# Set up your Agentuity credentials
cp apps/agentuity/.env.example apps/agentuity/.env
# Edit apps/agentuity/.env and add your AGENTUITY_SDK_KEY

# Start development (both frontend and backend)
bun dev
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

### 3. Frontend Gets Type Safety (`apps/web`)

```typescript
// apps/web/src/components/TranslateDemo.tsx
import '@agentuity/routes'; // Generated types
import { LANGUAGES, type Language } from '@tanstack-turborepo/shared';

const { data, invoke } = useAPI('POST /api/translate');
// TypeScript knows the exact input/output types!
```

### 4. Turborepo Orchestrates Everything

```bash
bun dev    # Builds routes first, then runs both apps in parallel
bun build  # Builds agentuity first (for route types), then web
```

## Commands

| Command | Description |
|---------|-------------|
| `bun dev` | Start both frontend and backend |
| `bun build` | Build all packages |
| `bun typecheck` | Type-check all packages |

## Ports

- **Frontend**: http://localhost:3000
- **Agentuity Backend**: http://localhost:3500
- **Agent Workbench**: http://localhost:3500/workbench

## Type Safety Flow

1. Schemas defined in `packages/shared`
2. Agent uses schemas → `agentuity build` generates `routes.ts`
3. Frontend imports `@agentuity/routes` (TS path alias)
4. `useAPI('POST /api/translate')` is fully typed

## Deploying

The frontend and backend are independently deployable:

```bash
# Deploy just the agent
cd apps/agentuity && bun run deploy

# Build frontend for production
cd apps/web && bun run build
```

## Environment Variables

Create `apps/agentuity/.env` with:

```bash
# Required: Agentuity SDK key
AGENTUITY_SDK_KEY=your_key_here
```

Get your SDK key from [agentuity.com](https://agentuity.com).
