# CrewAI Framework Example

[![Deploy with Agentuity](https://app.agentuity.com/img/deploy.svg)](https://app.agentuity.com/deploy)

## Overview

This example demonstrates how to integrate CrewAI with Agentuity to create a multi-agent system that can research topics and generate reports.

## How It Works

The agent uses CrewAI to create a crew of specialized agents:

1. **Researcher Agent**: Specializes in finding information about a given topic

   - Configured with a role, goal, and backstory from YAML
   - Uses OpenAI's GPT-4o Mini model

2. **Reporting Analyst Agent**: Specializes in creating detailed reports

   - Configured with a role, goal, and backstory from YAML
   - Uses OpenAI's GPT-4o Mini model

3. **Sequential Process**: The agents work in sequence
   - First, the researcher gathers information
   - Then, the reporting analyst creates a detailed report

## Environment Setup

To run this example, you'll need to set up the following environment variables:

```
OPENAI_API_KEY=your_openai_api_key
```

## Running Locally

To run this agent locally:

```bash
# Navigate to the agent directory
cd py-crewai

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
cd py-crewai

# Deploy the agent
agentuity deploy
```

After deployment, you can access your agent through the Agentuity Cloud dashboard.

## Example Usage

You can interact with the agent by sending text requests:

```
Research and create a report on quantum computing
```

The agent will:

1. Use the researcher agent to gather information about quantum computing
2. Use the reporting analyst to create a detailed report
3. Return the final report as the response

## Additional Documentation

- [CrewAI Documentation](https://docs.crewai.com/)
- [Agentuity Documentation](https://agentuity.dev/)
