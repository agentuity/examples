# Vercel AI SDK Framework Examples

## Overview
This project demonstrates how to integrate the Vercel AI SDK with Agentuity to create AI agents powered by different language models. The examples show how to use both OpenAI and Anthropic models through the Vercel AI SDK.

## Examples Included

### 1. OpenAI Integration
The `vercel-openai` agent demonstrates how to use OpenAI's GPT-4o Mini model through the Vercel AI SDK. It:
- Accepts text input from the user
- Processes the input using OpenAI's model
- Returns the generated response

### 2. Anthropic Integration
The `vercel-anthropic` agent demonstrates how to use Anthropic's Claude 3 Haiku model through the Vercel AI SDK. It:
- Accepts text input from the user
- Processes the input using Anthropic's model
- Returns the generated response

## How It Works
Both examples use the Vercel AI SDK's `generateText` function to interact with the respective AI models. The agents:

1. Extract the prompt from the request
2. Log the incoming prompt
3. Generate a response using the specified AI model
4. Return the generated text to the user

## Environment Setup
To run these examples, you'll need to set up the following environment variables:

For OpenAI:
```
OPENAI_API_KEY=your_openai_api_key
```

For Anthropic:
```
ANTHROPIC_API_KEY=your_anthropic_api_key
```

## Running Locally
To run these agents locally:

```bash
# Navigate to the agent directory
cd vercel-framework

# Install dependencies
npm install

# Run the agent locally
agentuity run
```

## Deployment
To deploy these agents to Agentuity Cloud:

```bash
# Navigate to the agent directory
cd vercel-framework

# Deploy the agent
agentuity deploy
```

After deployment, you can access your agents through the Agentuity Cloud dashboard.

## Additional Documentation
- [Vercel AI SDK Documentation](https://sdk.vercel.ai/docs)
- [OpenAI API Documentation](https://platform.openai.com/docs/api-reference)
- [Anthropic API Documentation](https://docs.anthropic.com/claude/reference)
- [Agentuity Documentation](https://agentuity.dev/)
