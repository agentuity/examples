# Google ADK Agent

An Agentuity agent that demonstrates **Google Agent Development Kit (ADK)** integration with the **Agentuity runtime**, bridging a Google ADK agent into a deployable full-stack application with API routes and a React frontend.

## What It Does

- **Google ADK Integration** — Wraps a Google ADK `LlmAgent` (powered by `gemini-2.5-flash`) inside the Agentuity runtime, letting you deploy ADK agents as production services.
- **Time Lookup Tool** — The ADK agent uses a `get_current_time` function tool with Zod-validated input to return the current time for 18+ cities worldwide.
- **Agentuity Bridge Pattern** — Shows how to run an ADK `InMemoryRunner` inside an Agentuity agent handler, translating between ADK events and Agentuity's request/response model.
- **Translation Agent** — Includes a second agent that translates text using the Agentuity AI Gateway (OpenAI-compatible), with thread-based history persistence.
- **Agent Evals** — Demonstrates Agentuity's eval system with adversarial and language-match evaluations on the translation agent.
- **React Frontend** — A Tailwind-styled UI for interacting with the ADK bridge agent.

## Quick Start

1. Install the [Agentuity CLI](https://agentuity.sh): `curl -fsS https://agentuity.sh | sh`
2. Import the project: `agentuity project import`
3. Install dependencies: `bun install`
4. Set your Gemini API key (see [Environment Variables](#environment-variables))
5. Start the dev server: `bun run dev`
6. Open `http://localhost:3500`, enter a city name, and click **Run ADK**.

## Environment Variables

Create a `.env` file in the project root:

```bash
GEMINI_API_KEY="your-gemini-api-key"
```

Get a key from [Google AI Studio](https://aistudio.google.com/app/apikey). The ADK agent also accepts `GOOGLE_GENAI_API_KEY` as an alternative.

> **Note:** The translation agent uses the Agentuity AI Gateway, which routes requests automatically — no separate OpenAI key is needed.

## Project Structure

```
google-adk1/
├── src/
│   ├── adk/
│   │   ├── agent.ts              # Google ADK agent definition (LlmAgent + tools)
│   │   └── types.d.ts            # TypeScript shim for ADK ESM imports
│   ├── agent/
│   │   ├── adk-time/
│   │   │   ├── agent.ts          # Agentuity bridge: runs ADK InMemoryRunner
│   │   │   └── index.ts          # Re-exports agent + schemas
│   │   └── translate/
│   │       ├── index.ts          # Translation agent (AI Gateway + thread state)
│   │       └── eval.ts           # Adversarial + language-match evals
│   ├── api/
│   │   └── index.ts              # API routes (translate, adk-time, history)
│   └── web/
│       ├── App.tsx               # React UI for ADK time lookup
│       ├── App.css               # Tailwind styles
│       ├── frontend.tsx          # React entry point
│       └── index.html            # HTML template
├── app.ts                        # Application entry point
├── agentuity.config.ts           # Vite config (React + Tailwind)
└── package.json
```

## How It Works

### ADK Bridge Pattern

The core pattern demonstrated here is running a Google ADK agent inside Agentuity:

1. **Define the ADK agent** (`src/adk/agent.ts`) — A standard Google ADK `LlmAgent` with a `FunctionTool` that looks up the current time for a city using `Intl.DateTimeFormat`.
2. **Create the Agentuity bridge** (`src/agent/adk-time/agent.ts`) — An Agentuity agent that wraps the ADK agent in an `InMemoryRunner`, iterates over ADK events, and returns the final response.
3. **Expose via API** (`src/api/index.ts`) — A `POST /api/adk-time` route calls the bridge agent with validated input.
4. **Frontend** (`src/web/App.tsx`) — The React UI sends a city name to the API and displays the ADK response.

```
User → React UI → POST /api/adk-time → Agentuity Bridge Agent → ADK InMemoryRunner → Gemini 2.5 Flash → Response
```

### Supported Cities

The ADK agent maps city names to IANA timezones. Supported cities include: Berlin, Boston, Chennai, Chicago, Delhi, Dubai, Frankfurt, Jacksonville, Kolkata, London, Los Angeles, Madrid, Miami, New York, Paris, San Francisco, Singapore, and Tokyo. Unknown cities fall back to UTC.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/adk-time` | Get current time for a city via Google ADK |
| POST | `/api/translate` | Translate text using AI Gateway |
| GET | `/api/translate/history` | Get translation history from thread state |
| DELETE | `/api/translate/history` | Clear translation history |

### Example: ADK Time Request

```bash
curl -X POST http://localhost:3500/api/adk-time \
  -H "Content-Type: application/json" \
  -d '{"city": "Tokyo"}'
```

Response:

```json
{
  "city": "Tokyo",
  "eventCount": 4,
  "response": "The current time in Tokyo is 2:30 AM JST."
}
```

## Running the ADK Agent Standalone

The ADK agent can also run independently outside Agentuity using the Google ADK CLI:

```bash
# Interactive CLI mode
bun run adk:run

# ADK Web UI (opens at http://localhost:8000)
bun run adk:web
```

## Key Dependencies

| Package | Purpose |
|---------|---------|
| `@google/adk` | Google Agent Development Kit — LlmAgent, FunctionTool, InMemoryRunner |
| `@agentuity/runtime` | Agentuity agent runtime — createAgent, createApp, createRouter |
| `@agentuity/schema` | Schema validation (Zod-like) for agent I/O |
| `@agentuity/react` | React hooks — useAPI, useAnalytics |
| `@agentuity/evals` | Agent evaluation framework |
| `zod` | Input validation for ADK tool parameters |
| `openai` | OpenAI SDK (used via Agentuity AI Gateway for translations) |
| `groq-sdk` | Groq SDK (used via AI Gateway for eval language detection) |

## Commands

```bash
bun run dev         # Start development server
bun run build       # Build for production
bun run typecheck   # Run TypeScript type checking
bun run deploy      # Deploy to Agentuity cloud
bun run adk:run     # Run ADK agent in CLI mode (standalone)
bun run adk:web     # Run ADK Web UI (standalone)
```

## Requirements

- [Bun](https://bun.sh/) v1.0+
- [Agentuity CLI](https://agentuity.sh)
- A Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
