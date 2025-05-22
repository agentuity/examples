# LangChain Framework Example

## Overview
This example demonstrates how to integrate LangChain with Agentuity to create an AI agent that can process natural language requests.

## How It Works
The agent uses LangChain's components to create a simple chain:

1. **LLM Setup**: Creates a ChatOpenAI instance using OpenAI's GPT-4o Mini model
2. **Prompt Template**: Defines a system message and user input template
3. **Output Parser**: Uses a string output parser to format the response
4. **Chain Creation**: Combines the prompt, LLM, and parser into a processing chain
5. **Request Processing**: Processes incoming text requests through the LangChain chain
6. **Response Generation**: Returns the generated text to the user

## Environment Setup
To run this example, you'll need to set up the following environment variables:

```
OPENAI_API_KEY=your_openai_api_key
```

## Running Locally
To run this agent locally:

```bash
# Navigate to the agent directory
cd py-langchain

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
cd py-langchain

# Deploy the agent
agentuity deploy
```

After deployment, you can access your agent through the Agentuity Cloud dashboard.

## Example Usage
You can interact with the agent by sending text requests:

```
What are the main features of LangChain?
```

The agent will process your request and return a detailed response about LangChain's features.

## Additional Documentation
- [LangChain Documentation](https://python.langchain.com/docs/get_started/introduction)
- [Agentuity Documentation](https://agentuity.dev/)
