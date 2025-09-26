# Airbnb MCP Agent

This example demonstrates how to convert an Agno Airbnb MCP agent to work with the Agentuity platform. The agent uses Model Context Protocol (MCP) tools to search for Airbnb listings and provide accommodation assistance.

## Features

- **MCP Integration**: Uses Airbnb MCP server for property search and details
- **Groq Model**: Powered by Meta's Llama 3.3 70B model via Groq
- **Reasoning Tools**: Enhanced with reasoning capabilities for better responses
- **Async Support**: Proper async handling for MCP tools context management

## Setup

1. Install dependencies:
```bash
uv sync
```

2. Run the agent locally:
```bash
agentuity dev
```

3. Test the agent by visiting the local URL and trying sample prompts like:
   - "Find me a 2-bedroom apartment in San Francisco for next weekend"
   - "What amenities are available at property ID 12345?"
   - "Help me understand the booking process for a vacation rental"

## Architecture

The agent follows the Agentuity template structure:

- `agentuity_agents/AirbnbMcp/agent.py` - Agentuity wrapper implementing the required interface
- `agentuity_agents/AirbnbMcp/airbnb_mcp_agent.py` - Original Agno agent logic with MCP tools
- `agentuity.yaml` - Project configuration
- `pyproject.toml` - Dependencies and project metadata

## Dependencies

- `agentuity` - Agentuity SDK for agent framework
- `agno` - Agno framework for AI agents
- `groq` - Groq API client for Llama models
- `mcp` - Model Context Protocol tools

## Original Source

This agent is converted from the Agno documentation example:
https://docs.agno.com/examples/use-cases/agents/airbnb_mcp
