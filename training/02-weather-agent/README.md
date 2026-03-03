# Weather Agent

Fetch real-time weather from the National Weather Service API, cache results with a 5-minute TTL, and generate a conversational summary using OpenAI via the Vercel AI SDK.

## Getting Started

```bash
bun install
bun run dev
```

Open [localhost:3500](http://localhost:3500) for the frontend, or [localhost:3500/workbench](http://localhost:3500/workbench) to test the agent directly.

## What's Inside

The `weather` agent accepts a `{ location }` input, looks up coordinates for the requested city, checks KV cache before hitting the NWS API, and passes the raw forecast to an LLM to produce a one-sentence summary:

```typescript
const cacheKey = `city_${location.toLowerCase().replace(/\s+/g, '_')}`;

// Return cached result if available (5-minute TTL)
const cached = await ctx.kv.get('weather', cacheKey);
if (cached.exists) {
  ctx.logger.info(`Returning cached weather for ${location}`);
  return cached.data as WeatherResult;
}

// Fetch from NWS (two-step: coordinates -> grid points -> forecast)
const weather = await fetchNWSWeather(coordinates.lat, coordinates.lon, location, ctx);

// Cache for 5 minutes, then generate AI summary
await ctx.kv.set('weather', cacheKey, weather, { ttl: 300 });
```

After fetching, the agent calls `generateText` from `ai` with `openai('gpt-5-nano')` to turn the raw NWS forecast text into a readable sentence. If the LLM call fails, `ai_summary` falls back to `null` so the raw data is still returned.

The output schema is a union of three shapes: a success response with `location`, `temperature`, `forecast`, and `ai_summary`; an error response with `error`, `message`, and optional `supported_cities`; and a plain string for test/ping requests.

NWS requires a `User-Agent` header on all requests. Both fetch calls use `AbortSignal.timeout(10000)` to enforce a 10-second ceiling per request.

## Project Structure

```
src/
├── agent/weather/
│   ├── agent.ts      # NWS fetch, KV caching, AI summary, union output schema
│   └── index.ts
├── api/index.ts      # POST /api/weather
├── generated/        # Auto-generated app wiring (do not edit)
│   ├── app.ts
│   ├── registry.ts
│   └── routes.ts
└── web/
    ├── App.tsx        # React frontend
    ├── frontend.tsx
    └── index.html
```

## Related

- [Creating agents](https://agentuity.dev/agents/creating-agents)
- [AI SDK integration](https://agentuity.dev/agents/ai-sdk-integration)
- [KV storage](https://agentuity.dev/services/storage/key-value)
- [Schema libraries](https://agentuity.dev/agents/schema-libraries)
- [Agentuity SDK](https://github.com/agentuity/sdk)
