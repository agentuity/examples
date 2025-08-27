# Mastra System Prompt (Agentuity Wrapper)

Wraps Mastra’s “Changing the System Prompt” example with Agentuity’s agent interface.

- Preserves Mastra framework code and patterns (`@mastra/core/agent`, `@ai-sdk/openai`)
- Exposes Agentuity `welcome()` and default `Agent(req, resp, ctx)`
- Demonstrates passing a runtime system prompt

Usage tip:
- Prefix your input with a system line to change the voice:
  - `system: You are Harry Potter.\nTalk about the value of friendship.`
  - `system: You are Hermione Granger.\nShare study tips.`
