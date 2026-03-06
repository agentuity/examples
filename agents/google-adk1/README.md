# google-adk1

This repository demonstrates two things side by side:

1. A full Agentuity app (`src/agent/translate`, `src/api`, `src/web`).
2. A standalone Google ADK TypeScript quickstart agent (`src/adk/agent.ts`).

## Requirements

- Bun 1.0+
- A Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)

## Install

```bash
bun install
```

## Environment Variables

Add this to your local `.env` file:

```bash
GEMINI_API_KEY="YOUR_API_KEY"
```

## Agentuity Commands

```bash
bun run dev
bun run build
bun run typecheck
bun run deploy
```

## Google ADK Quickstart (In This Repo)

The ADK example lives at `src/adk/agent.ts` and exports `rootAgent` using:

- `LlmAgent` with model `gemini-2.5-flash`
- A function tool named `get_current_time`
- Zod input validation for the tool schema

### Run ADK In CLI

```bash
bun run adk:run
```

### Run ADK Web UI

```bash
bun run adk:web
```

Then open `http://localhost:8000`.

## ADK Integrated In Agentuity App

This repo now includes an Agentuity bridge agent that runs ADK from inside the deployable app:

- Agent: `src/agent/adk-time/agent.ts`
- API route: `POST /api/adk-time`
- Frontend test panel: `src/web/App.tsx` ("Google ADK Inside Agentuity")

Run the normal app and test ADK through Agentuity:

```bash
bun run dev
```

Then open `http://localhost:3500`, enter a city, and click **Run ADK**.

## Relevant Files

- `src/adk/agent.ts` - Google ADK TypeScript quickstart implementation
- `src/agent/adk-time/agent.ts` - Agentuity bridge that executes ADK runner
- `src/agent/translate/index.ts` - Agentuity translation agent
- `src/api/index.ts` - Agentuity API routes for translation/history
- `src/web/App.tsx` - React UI for translation and ADK bridge testing
