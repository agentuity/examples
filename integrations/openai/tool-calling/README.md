# Tool Calling

Demonstrates the core OpenAI Agents JS SDK tool-calling pattern on Agentuity: defining function tools with Zod schemas and running an agent through an automatic ReAct loop.

## Getting Started

```bash
bun install
bun run dev
```

## What It Does

A `Research Assistant` agent is equipped with `search` and `get_weather` tools defined using `tool()` with Zod parameter schemas. When `run()` is called, the SDK handles the full ReAct loop automatically: the model decides which tools to call, executes them, observes the results, and reasons until it produces a final answer. The response includes the agent's text output plus a `steps` trace extracted from `result.newItems`, showing each `tool_call`, `tool_result`, and final `ai` message in order.

## Key Concepts

- `tool()` with a Zod `parameters` schema and `execute` function defines a typed function tool
- `run(agent, message)` drives the full ReAct loop without manual orchestration
- `result.newItems` contains the ordered trace of tool calls, tool outputs, and messages
- `result.finalOutput` holds the agent's final text response

## Related

- [OpenAI Agents SDK](https://openai.github.io/openai-agents-python/)
- [Agentuity SDK](https://github.com/agentuity/sdk)
