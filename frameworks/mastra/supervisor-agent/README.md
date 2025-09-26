# Mastra Supervisor Agent

A supervisor agent that coordinates copywriting, editing, and publishing workflows using the Mastra framework. This example demonstrates how to wrap the original Mastra supervisor agent pattern within Agentuity's structure while preserving all framework-specific functionality.

## Overview

This agent implements the supervisor pattern from the [Mastra documentation](https://mastra.ai/en/examples/agents/supervisor-agent), featuring:

- **Copywriter Agent**: Generates initial blog post content
- **Editor Agent**: Refines and improves the content  
- **Publisher Agent**: Acts as supervisor, coordinating the workflow between agents

The implementation preserves all original Mastra framework code while wrapping it in Agentuity's agent structure.

## Features

- Multi-agent coordination using Mastra's Agent class
- Tool integration with the copywriter tool
- Error handling with structured logging
- Welcome function with example prompts
- Follows Agentuity conventions for framework wrappers

## Usage

The agent accepts a topic and coordinates the creation of a blog post through the three-agent workflow:

1. Publisher agent receives the topic
2. Uses the copywriter tool to generate initial content
3. Coordinates with editor agent for refinement
4. Returns the final polished content

## Example Prompts

- "Write a blog post about artificial intelligence"
- "Create content about sustainable technology trends"
- "Generate a post about the future of remote work"

## Development

```bash
# Install dependencies
bun install

# Start development server
agentuity dev

# Build the project
agentuity build
```

## Framework Integration

This example demonstrates the proper way to wrap Mastra framework agents within Agentuity:

- Preserves all original Mastra imports and Agent classes
- Maintains framework-specific tool patterns
- Wraps the workflow in Agentuity's request/response structure
- Includes proper error handling and logging
