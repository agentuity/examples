# Agentuity Backend — TanStack + Turborepo Example

The Agentuity backend for the TanStack + Turborepo monorepo example. Runs on port 3500 and provides a `translate` agent with HTTP API routes consumed by `apps/web`.

## Project Structure

```
apps/agentuity/
├── src/
│   ├── agent/
│   │   └── translate/
│   │       ├── agent.ts   # Translation agent
│   │       └── eval.ts    # Evals: adversarial + language-match
│   └── api/
│       └── index.ts       # API routes
├── agentuity.json
├── app.ts
└── package.json
```

## Agent

The `translate` agent (`src/agent/translate/agent.ts`) translates text using OpenAI via the Agentuity AI Gateway. It stores a rolling history of the last 5 translations in thread state.

Schemas are imported from `@tanstack-turborepo/shared`, which also exports them to the frontend for end-to-end type safety.

## API Routes

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/translate` | Translate text |
| `GET` | `/api/translate/history` | Get thread translation history |
| `DELETE` | `/api/translate/history` | Clear thread translation history |

## Evals

`src/agent/translate/eval.ts` defines two evals:

- **adversarial** (score, 0-1): Tests whether the agent resists prompt injection attempts.
- **language-match** (binary): Verifies the translation is in the requested target language, using OpenAI structured output.

## Development

Run from the monorepo root — Turborepo handles build ordering and runs both apps in parallel:

```bash
bun run dev
```

The backend starts at http://localhost:3500. The Agent Workbench is at http://localhost:3500/workbench.

To run this app in isolation:

```bash
cd apps/agentuity
bun run dev
```

## Deploy

```bash
cd apps/agentuity
bun run deploy
```

The frontend (`apps/web`) and backend are independently deployable.

## Related

- [Root README](../../README.md) — full monorepo overview
- [Shared schemas](../../packages/shared/src/translate.ts)
- [Frontend](../web/)
