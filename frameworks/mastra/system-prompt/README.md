# Mastra System Prompt Example

This example demonstrates how to use Mastra's system prompt functionality within an Agentuity agent to create different character voices from the Harry Potter universe.

## Overview

The agent uses Mastra's `Agent` class with different system prompts to switch between character personalities:

- **Hermione Granger**: Brilliant, studious, and detail-oriented
- **Hagrid**: Warm, friendly, passionate about magical creatures
- **Dumbledore**: Wise, philosophical, and cryptic
- **Severus Snape**: Stern, sarcastic, and precise
- **Harry Potter**: Brave, modest, and straightforward

## Features

- Character detection from user input
- Dynamic system prompt switching
- Authentic character voice simulation
- Error handling and logging

## Usage

1. Install dependencies:
   ```bash
   bun install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   # Add your OPENAI_API_KEY to .env
   ```

3. Run the agent:
   ```bash
   agentuity dev
   ```

4. Test the agent by asking it to speak as different characters:
   - "Speak as Hermione about studying"
   - "Speak as Hagrid about dragons"
   - "Speak as Dumbledore about wisdom"

## Dependencies

- `@mastra/core`: Core Mastra framework
- `@ai-sdk/openai`: OpenAI integration for Mastra
- `@agentuity/sdk`: Agentuity agent framework

## Implementation

The agent implements the Agentuity wrapper pattern:

- `welcome()`: Returns welcome message and example prompts
- `Agent(req, resp, ctx)`: Main agent function that processes requests

The character detection is done through simple keyword matching, and each character has a detailed system prompt that defines their personality and speaking style.
