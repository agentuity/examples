# Claude Code SDK in Agentuity

[![Deploy with Agentuity](https://app.agentuity.com/img/deploy.svg)](https://app.agentuity.com/deploy)

This project showcases how the Claude Code SDK can be used in an Agentuity agent.
With Agentuity's AI Gateway, you can use Clause Code SDK without setting up your own API keys, just right out of the box!

There a few sample Python files in the `claude-references` folder which you can use to test the agent.

You can interact with this agent conversationally to get it to interact with the codebase, it will remember your convsersation history by session.

## Quick Start

1. Clone this repository.
2. Make sure you have installed the Agentuity CLI (`curl -fsS https://agentuity.sh | sh`)
3. Run `agentuity project import` to import the project into your Agentuity account.
4. Install Claude Code SDK (`npm install @anthropic-ai/claude-code-sdk`)

- You will also need npm installed to do this.

5. Run `agentuity dev` to start the local development server.
6. Send the agent requests of the format:

```json
{
  "session": "session_id",
  "prompt": "prompt"
}
```

## Implementation

The agent uses the `query` function to send requests to Claude Code SDK. The Claude Code SDK supports all the features of the Claude Code CLI, so it can read, write, and execute code.
It also uses Agentuity's KV store to remember the conversation history by session.
