# LlamaIndex Framework Example

[![Deploy with Agentuity](https://app.agentuity.com/img/deploy.svg)](https://app.agentuity.com/deploy)

## Overview

This example demonstrates how to integrate LlamaIndex with Agentuity to create an AI agent that can perform calculations using tools.

## How It Works

The agent uses LlamaIndex's `AgentWorkflow` to create a workflow with a calculator tool:

1. **Tool Definition**: Defines a simple `multiply` function that multiplies two numbers
2. **Agent Creation**: Creates an agent workflow using the tool and OpenAI's GPT-4o Mini model
3. **Request Processing**: Processes incoming text requests through the LlamaIndex agent
4. **Response Generation**: Returns the agent's response to the user

## Environment Setup

To run this example, you'll need to set up the following environment variables:

```
OPENAI_API_KEY=your_openai_api_key
```

## Running Locally

To run this agent locally:

```bash
# Navigate to the agent directory
cd py-llamaindex

# Create a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -e .

# Run the agent locally
agentuity run
```

## Deployment

To deploy this agent to Agentuity Cloud:

```bash
# Navigate to the agent directory
cd py-llamaindex

# Deploy the agent
agentuity deploy
```

After deployment, you can access your agent through the Agentuity Cloud dashboard.

## Example Usage

You can interact with the agent by sending text requests:

```
What is 123 * 456?
```

The agent will use its multiply tool to calculate the result and return:

```
123 * 456 = 56088
```

## Additional Documentation

- [LlamaIndex Documentation](https://docs.llamaindex.ai/)
- [Agentuity Documentation](https://agentuity.dev/)
