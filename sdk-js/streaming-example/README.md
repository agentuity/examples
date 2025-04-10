# Streaming Response Example

## Overview
This example demonstrates how to use streaming responses with the Agentuity JavaScript SDK. It shows how to implement a streaming agent that can send real-time text responses to clients.

## How It Works
The agent:
1. Receives a JSON request with an optional `text` field
2. Uses the AI SDK to stream text from an OpenAI model
3. Returns the response as a stream to the client
4. Demonstrates proper handling of streaming responses

## Usage Example
Send a JSON request with the following structure:

```json
{
  "text": "Explain quantum computing"
}
```

If no text is provided, the agent will use a default prompt ("Why is the sky blue?").

## Running Locally
To run this agent locally:

```bash
# Navigate to the agent directory
cd streaming-example

# Install dependencies
bun install

# Run the agent locally
agentuity dev
```

## Deployment
To deploy this agent to Agentuity Cloud:

```bash
# Deploy the agent
agentuity deploy
```

After deployment, you can access your agent through the Agentuity Cloud dashboard.

## Additional Documentation
For more information about Agentuity and its capabilities, visit [https://agentuity.dev/](https://agentuity.dev/).
