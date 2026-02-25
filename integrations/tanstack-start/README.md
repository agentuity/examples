# TanStack Start + Agentuity

Upgrade pattern for an existing TanStack Start frontend that adds an Agentuity backend runtime for AI routes.

## What This Example Shows

- Two-runtime architecture:
  - TanStack Start frontend runtime (`localhost:3000`)
  - Agentuity backend runtime (`localhost:3500`)
- Translate workflow using `useAPI`:
  - `POST /api/translate`
  - `GET /api/translate/history`
  - `DELETE /api/translate/history`
- Eval wiring on the translate agent:
  - `adversarial` preset eval
  - `language-match` custom eval
- Type-safe route augmentation via `@agentuity/routes`
- Local proxy mode and cross-origin `baseUrl` mode

## Official References

- TanStack Start hosting: https://tanstack.com/start/latest/docs/framework/react/guide/hosting
- TanStack Start server routes: https://tanstack.com/start/latest/docs/framework/react/guide/server-routes
- Vite proxy options: https://vite.dev/config/server-options#server-proxy

## Project Layout

```text
tanstack-start/
├── src/
│   ├── router.tsx                        # getRouter() + route registration
│   ├── routes/__root.tsx                 # TanStack Start root shell
│   ├── routes/index.tsx                  # Translate/history UI using useAPI
│   └── routeTree.gen.ts                  # Generated route tree
├── agentuity/
│   ├── src/agent/translate/agent.ts      # Translate agent
│   ├── src/agent/translate/eval.ts       # Evals (adversarial + language-match)
│   ├── src/agent/translate/state.ts      # History state schema
│   ├── src/api/index.ts                  # /api/translate* routes
│   └── src/generated/routes.ts           # Generated frontend route augmentation
├── vite.config.ts                        # TanStack Start plugin + /api proxy
└── tsconfig.json                         # @agentuity/routes alias
```

## Running Locally

```bash
cd integrations/tanstack-start
bun install
bun run build:agent
bun run dev
```

- Frontend: http://localhost:3000
- Backend: http://localhost:3500
- Workbench: http://localhost:3500/workbench

### AI Credentials in Local-Only Mode

If the project is not registered with Agentuity Cloud, translation calls require provider keys:

- `OPENAI_API_KEY` for translate agent calls
- `GROQ_API_KEY` for eval model calls

Without credentials, the backend still starts and history endpoints work, but `POST /api/translate` returns `500`.

## Frontend Type Safety

The route component keeps the required side-effect import:

```tsx
import '@agentuity/routes';
```

That enables typed `useAPI` route keys and payloads for:

- `useAPI('POST /api/translate')`
- `useAPI('GET /api/translate/history')`
- `useAPI('DELETE /api/translate/history')`

## Verification Workflow

Run this after changing backend routes, schemas, or frontend route calls:

```bash
cd integrations/tanstack-start
bun run build:agent
bun run typecheck
bun run test
```

- `build:agent` regenerates `agentuity/src/generated/routes.ts`, which typed frontend routes depend on.
- Keep `import '@agentuity/routes'` so generated route typings are loaded.
- Keep exact method+path literal keys in `useAPI(...)` for strong typing.

## Deployment

This example runs two separate runtimes when deployed.

1. Preferred: host-level proxy/rewrite
- Route frontend `/api/*` traffic to the Agentuity backend.
- Equivalent to local Vite `server.proxy` behavior, but configured at your host/load balancer.

2. Fallback: explicit backend base URL from the frontend
- Set frontend env: `VITE_AGENTUITY_BASE_URL=https://your-agentuity-backend.example.com`
- Passes through `AgentuityProvider baseUrl`.
- Enable cross-origin backend access with:
  - `AGENTUITY_CORS_ALLOWED_ORIGINS=https://your-frontend.example.com`

Backend CORS is configured with trusted-origin mode plus optional extra origins from that env variable.

## Related

- [React hooks](https://agentuity.dev/frontend/react-hooks)
- [Provider setup](https://agentuity.dev/frontend/provider-setup)
- [Deployment scenarios](https://agentuity.dev/frontend/deployment-scenarios)
- [Evaluations](https://agentuity.dev/agents/evaluations)
- [HTTP routes](https://agentuity.dev/routes/http)
- [Agentuity SDK](https://github.com/agentuity/sdk)
