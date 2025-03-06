# Mastra Simple Prompt

## Overview
The Simple Prompt agent demonstrates how to create a basic agent that uses a tool to fetch external data. This example creates a cat expert assistant that incorporates random cat facts into its responses.

## How It Works
The agent consists of:

1. **Cat Expert Agent**:
   - Uses GPT-4o Mini with instructions to act as a cat expert
   - Answers questions about cats while incorporating interesting cat facts

2. **Cat Fact Tool**:
   - Fetches random cat facts from the catfact.ninja API
   - Provides verified cat facts to the agent
   - Demonstrates how to create and use tools with Mastra

The agent is instructed to use the cat fact tool at least once in every response to ensure accurate information is included.

## Running Locally
To run this agent locally:

```bash
# Navigate to the agent directory
cd mastra-simple-prompt

# Install dependencies
npm install

# Run the agent locally
agentuity run
```

You can test the agent by sending it a text prompt about cats.

## Deployment
To deploy this agent to Agentuity Cloud:

```bash
# Navigate to the agent directory
cd mastra-simple-prompt

# Deploy the agent
agentuity deploy
```

After deployment, you can access your agent through the Agentuity Cloud dashboard.

## Additional Documentation
For more information about Agentuity and its capabilities, visit [https://agentuity.dev/](https://agentuity.dev/).
