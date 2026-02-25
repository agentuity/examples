# Next.js + Agentuity

Upgrade pattern for an existing Next.js App Router frontend that adds an Agentuity backend runtime for AI routes.

## What This Example Shows

- Two-runtime architecture:
  - Next.js frontend runtime (`localhost:3001`)
  - Agentuity backend runtime (`localhost:3501`)
- Dev startup gate: `wait-on` checks backend health (`/api/health`) before Next.js boots
- Translate workflow:
  - `GET /api/translate/history`, `POST /api/translate`, and `DELETE /api/translate/history` use `useAPI`
- Eval wiring on the translate agent:
  - `adversarial` preset eval
  - `language-match` custom eval
- Type-safe route augmentation via `@agentuity/routes`
- Local proxy mode and cross-origin `baseUrl` mode

## Official References

- Next.js rewrites: https://nextjs.org/docs/app/api-reference/config/next-config-js/rewrites
- Next.js `'use client'`: https://nextjs.org/docs/app/api-reference/directives/use-client

## Project Layout

```text
nextjs/
├── app/                                # Next.js frontend
│   ├── components/TranslateDemo.tsx     # Translate + history UI
│   ├── layout.tsx
│   └── page.tsx
├── agentuity/                          # Agentuity backend
│   ├── src/agent/translate/agent.ts    # Translate agent
│   ├── src/agent/translate/eval.ts     # Evals (adversarial + language-match)
│   ├── src/agent/translate/state.ts    # History state schema
│   ├── src/api/index.ts                # /api/translate* routes
│   └── src/generated/routes.ts         # Generated frontend route augmentation
├── next.config.ts                      # /api/* rewrite to Agentuity backend
└── tsconfig.json                       # @agentuity/routes alias
```

## Running Locally

Run from the **project root** (`integrations/nextjs`), not from inside `agentuity/`. The root `dev` script starts both the frontend and backend together:

```bash
cd integrations/nextjs
bun install
bun run build:agent
bun run dev
```

`bun run dev` starts both runtimes concurrently, and the web process uses `wait-on` to check `http://127.0.0.1:3501/api/health` before launching Next.js. Running `bun run dev` inside `agentuity/` starts only the backend, which serves the API and workbench but not the frontend page.

- Frontend: http://localhost:3001
- Backend: http://localhost:3501
- Workbench: http://localhost:3501/workbench

### AI Credentials in Local-Only Mode

If the project is not registered with Agentuity Cloud, translation calls require provider keys:

- `OPENAI_API_KEY` for translate agent calls
- `GROQ_API_KEY` for eval model calls

Without credentials, the backend still starts and history endpoints work, but `POST /api/translate` returns `500`.

## Warnings and Local-vs-Cloud Notes

- If Next.js warns about workspace root detection, keep `outputFileTracingRoot` in `next.config.ts` pointed to the monorepo root.
- Local default mode uses rewrite proxying in development: `/api/:path* -> http://localhost:3501/api/:path*`.
- To override proxy target, set `AGENTUITY_PROXY_TARGET` (for example `https://backend.example.com`).
- Cross-origin mode skips the rewrite and uses `NEXT_PUBLIC_AGENTUITY_BASE_URL` in `AgentuityProvider`.
- In local-only mode without provider credentials, `POST /api/translate` can return `500`; history endpoints still work.
- If backend startup is delayed, `wait-on` waits up to 30 seconds before failing with a timeout error.
- If you see a `DEP0060` warning while using Next.js rewrites/proxy in dev, treat it as a known transitive dev-time warning unless request routing is actually failing.

## Frontend Type Safety

The client component keeps the required side-effect import:

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
cd integrations/nextjs
bun run build:agent
bun run test
```

- `build:agent` regenerates `agentuity/src/generated/routes.ts`, which typed frontend routes depend on.
- Keep `import '@agentuity/routes'` so generated route typings are loaded.
- Keep exact method+path literal keys in `useAPI(...)` for strong typing.
- `test` is a practical check (`build:agent && typecheck`), not a separate test framework setup.

## Deployment

This example runs two separate runtimes when deployed.

1. Preferred: host-level proxy/rewrite
- Route frontend `/api/*` traffic to the Agentuity backend.
- Equivalent to local `next.config.ts` rewrite behavior, but configured at your host/load balancer.

2. Fallback: explicit backend base URL from the frontend
- Set frontend env: `NEXT_PUBLIC_AGENTUITY_BASE_URL=https://your-agentuity-backend.example.com`
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
