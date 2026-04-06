# TanStack Start + Agentuity

Upgrade pattern for an existing TanStack Start frontend that adds an Agentuity backend runtime for AI routes.

## What This Example Shows

- Two-runtime architecture:
  - TanStack Start frontend runtime (`localhost:3000`)
  - Agentuity backend runtime (`localhost:3500`)
- Translate workflow using plain `fetch()`:
  - `POST /api/translate`
  - `GET /api/translate/history`
  - `DELETE /api/translate/history`
- Eval wiring on the translate agent:
  - `adversarial` preset eval
  - `language-match` custom eval
- Local proxy mode and cross-origin `baseUrl` mode
- Route-scoped dev proxy for `'/api/translate*'` to the Agentuity backend

## Official References

- TanStack Start hosting: https://tanstack.com/start/latest/docs/framework/react/guide/hosting
- TanStack Start server routes: https://tanstack.com/start/latest/docs/framework/react/guide/server-routes
- TanStack Start hydration errors: https://tanstack.com/start/latest/docs/framework/react/guide/hydration-errors
- TanStack Router data loading: https://tanstack.com/router/latest/docs/guide/data-loading
- Vite proxy options: https://vite.dev/config/server-options#server-proxy

## Project Layout

```text
tanstack-start/
├── src/
│   ├── router.tsx                        # getRouter() + route registration
│   ├── routes/__root.tsx                 # TanStack Start root shell
│   ├── routes/index.tsx                  # Translate/history UI (plain fetch)
│   └── routeTree.gen.ts                  # Generated route tree
├── agentuity/
│   ├── src/agent/translate/agent.ts      # Translate agent
│   ├── src/agent/translate/eval.ts       # Evals (adversarial + language-match)
│   ├── src/agent/translate/state.ts      # History state schema
│   └── src/api/index.ts                  # /api/translate* routes
├── vite.config.ts                        # TanStack Start plugin + /api proxy
└── tsconfig.json
```

## Running Locally

Run from the **project root** (`existing-apps/tanstack-start`), not from inside `agentuity/`. The root `dev` script starts both the frontend and backend together:

```bash
cd existing-apps/tanstack-start
bun install
bun run build:agent
bun run dev
```

`bun run dev` starts both runtimes concurrently, and the web process uses `wait-on` to check `http://127.0.0.1:3500/api/health` before launching Vite. Running `bun run dev` inside `agentuity/` starts only the backend, which serves the API and workbench but not the frontend page.

- Frontend: http://localhost:3000
- Backend: http://localhost:3500
- Workbench: http://localhost:3500/workbench

In local dev, Vite proxies all `/api` requests to `http://localhost:3500`.

### AI Credentials in Local-Only Mode

If the project is not registered with Agentuity Cloud, translation calls require provider keys:

- `OPENAI_API_KEY` for translate agent calls
- `GROQ_API_KEY` for eval model calls

Without credentials, the backend still starts and history endpoints work, but `POST /api/translate` returns `500`.

## Frontend API Calls

The route component uses plain `fetch()` to call the Agentuity backend:

- `POST /api/translate` with JSON body `{ text, toLanguage, model }`
- `GET /api/translate/history`
- `DELETE /api/translate/history`

No wrapper library or provider component is needed. The `VITE_AGENTUITY_BASE_URL` env variable sets the base URL for cross-origin mode; in local proxy mode it defaults to empty (same origin).

## Verification Workflow

Run this after changing backend routes, schemas, or frontend route calls:

```bash
cd existing-apps/tanstack-start
bun run build:agent
bun run typecheck
bun run test
```

- `build:agent` builds the Agentuity backend.
- `typecheck` runs TypeScript type checking across the frontend.

## Deployment

This example runs two separate runtimes when deployed.

1. Preferred: host-level proxy/rewrite
- Route frontend `/api/*` traffic to the Agentuity backend.
- Equivalent to local Vite `server.proxy` behavior, but configured at your host/load balancer.

2. Fallback: explicit backend base URL from the frontend
- Set frontend env: `VITE_AGENTUITY_BASE_URL=https://your-agentuity-backend.example.com`
- The `fetch()` calls in the route component prepend this as the base URL.
- Enable cross-origin backend access with:
  - `AGENTUITY_CORS_ALLOWED_ORIGINS=https://your-frontend.example.com`

By default, the Agentuity runtime reflects any origin for CORS. For tighter control, add a `cors` option to `createApp()` (e.g., `cors: { sameOrigin: true }` or `cors: { origin: ['https://your-frontend.example.com'] }`).

## Related

- [React hooks](https://agentuity.dev/frontend/react-hooks)
- [Provider setup](https://agentuity.dev/frontend/provider-setup)
- [Deployment scenarios](https://agentuity.dev/frontend/deployment-scenarios)
- [Evaluations](https://agentuity.dev/agents/evaluations)
- [HTTP routes](https://agentuity.dev/routes/http)
- [Agentuity SDK](https://github.com/agentuity/sdk)
