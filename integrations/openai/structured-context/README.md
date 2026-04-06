# Structured Context

Demonstrates `RunContext<T>` for typed runtime context and `outputType` for structured JSON output using the OpenAI Agents JS SDK on Agentuity.

## Getting Started

```bash
bun install
bun run dev
```

## What It Does

A `Contact Finder` agent looks up contacts from a simulated database using `lookup_contact` and `list_contacts` tools. The tools receive a typed `RunContext<UserInfo>` at runtime containing the caller's name and role, which is used to personalize responses (e.g., admin vs. viewer views) without ever sending that data to the LLM. The agent is configured with `outputType: ContactOutput` (a Zod schema), so `result.finalOutput` is typed as the structured contact object rather than a plain string. The response includes both the parsed contact data and the context that was passed to tools.

## Key Concepts

- `RunContext<T>` passes typed data to tools at runtime, invisible to the LLM
- `outputType` on `Agent` forces `finalOutput` to match a Zod schema
- `Agent<UserInfo, typeof ContactOutput>` provides full type inference end-to-end
- Tool `execute` functions receive context as an optional second argument: `(args, ctx?: RunContext<T>)`

## Related

- [OpenAI Agents SDK](https://openai.github.io/openai-agents-python/)
- [Agentuity SDK](https://github.com/agentuity/sdk)
