# Streaming Events

Demonstrates how to use the OpenAI Agents JS SDK streaming API on Agentuity to capture a structured timeline of agent events rather than streaming text to the browser.

## Getting Started

```bash
bun install
bun run dev
```

## What It Does

The agent runs with `{ stream: true }` and iterates over events with `for-await-of`, classifying each into one of three event types: `raw_model_stream_event` (text deltas from the model), `run_item_stream_event` (tool calls and tool results), and `agent_updated_stream_event` (agent switches in multi-agent runs). Each event is recorded with a step number and elapsed timestamp, then returned as a timeline alongside the final response and total step count.

## Key Concepts

- `run(agent, input, { stream: true })` enables incremental event iteration
- Three event types: `raw_model_stream_event`, `run_item_stream_event`, `agent_updated_stream_event`
- `await result.completed` waits for the run to finish before reading `finalOutput`
- Tools use simulated delays to make streaming event ordering visible in the timeline

## Related

- [OpenAI Agents SDK](https://openai.github.io/openai-agents-python/)
- [Agentuity SDK](https://github.com/agentuity/sdk)
