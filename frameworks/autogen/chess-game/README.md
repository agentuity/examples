# AutoGen Chess Game Agent

This example demonstrates how to wrap Microsoft's AutoGen framework in an Agentuity agent. The agent simulates chess games between two AI players using AutoGen's multi-agent capabilities.

## Features

- **Multi-Agent Chess Simulation**: Watch two AI players compete in chess
- **AutoGen Integration**: Demonstrates AutoGen's agent coordination patterns
- **Interactive Commands**: Start games, view board positions, and get explanations
- **Strategic AI Play**: AI players analyze positions and make tactical decisions

## Getting Started

1. Install dependencies:
   ```bash
   uv sync
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

3. Start the development server:
   ```bash
   agentuity dev
   ```

4. Your agent will be available at the printed URL.

## Usage

Try these commands with the agent:

- `"start chess game"` - Begin a simulated game between two AI players
- `"show current board position"` - Display the chess board
- `"explain the last move"` - Learn about chess move mechanics

## Project Structure

- `agentuity_agents/ChessGame/` - Contains the chess game agent implementation
- `server.py` - Main server file (do not modify)
- `main.py` - Entry point (do not modify)
- `pyproject.toml` - Python dependencies and project configuration
- `agentuity.yaml` - Agentuity project configuration

## Environment Variables

Required environment variables:

```
AGENTUITY_SDK_KEY=your_agentuity_sdk_key_here
OPENAI_API_KEY=your_openai_api_key_here
```

## AutoGen Integration

This example showcases:
- AutoGen's multi-agent coordination patterns
- Chess game state management
- AI decision-making for strategic gameplay
- Integration with Agentuity's request/response model

The original AutoGen chess example has been adapted to work within Agentuity's agent framework while preserving the core multi-agent chess gameplay mechanics.
