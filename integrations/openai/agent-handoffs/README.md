# Agent Handoffs

Demonstrates multi-agent handoffs using the OpenAI Agents JS SDK on Agentuity, where a triage agent routes customer requests to specialist agents for billing, refunds, and FAQ.

## Getting Started

```bash
bun install
bun run dev
```

## What It Does

A `Triage Agent` receives incoming customer messages and hands off to one of three specialists: a `Billing Agent` (invoice lookups), a `Refund Agent` (refund processing), or an `FAQ Agent` (general questions). The example shows two handoff styles: a plain agent reference for basic delegation, and `handoff()` with `onHandoff` callback, typed `inputType`, and `toolNameOverride` for customized escalation. The response includes which agent ultimately handled the request via `result.lastAgent`.

## Key Concepts

- `handoffs` array on `Agent` for basic agent-to-agent delegation
- `handoff(agent, options)` with `onHandoff`, `inputType` (Zod schema), and `toolNameOverride`
- `Agent.create()` for proper type inference across handoff chains
- `result.lastAgent` to identify which specialist handled the request

## Related

- [OpenAI Agents SDK](https://openai.github.io/openai-agents-python/)
- [Agentuity SDK](https://github.com/agentuity/sdk)
