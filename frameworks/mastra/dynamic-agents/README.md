# Mastra Dynamic Agents

## Overview
The Dynamic Agents example demonstrates how to create agents that adapt their behavior and capabilities at runtime based on contextual input. Instead of relying on fixed configurations, these agents adjust to users, environments, or scenarios, enabling a single agent to serve personalized, context-aware responses.

This example shows how to:
- Create agents with dynamic instructions based on runtime context
- Set and use runtime context variables (user tier, language preferences)
- Adapt agent behavior based on contextual input
- Integrate dynamic Mastra agents with Agentuity's platform

## Features

- **Dynamic Context**: Agent behavior changes based on user tier (free, pro, enterprise)
- **Language Support**: Responds in different languages based on context
- **Runtime Adaptation**: Instructions and responses adapt to the current context
- **Agentuity Integration**: Wrapped in Agentuity's structure with proper error handling

## Prerequisites

This example uses the `openai` model. Make sure to add `OPENAI_API_KEY` to your `.env` file.

```env
OPENAI_API_KEY=<your-api-key>
```

## Local Development

```bash
# Navigate to the agent directory
cd mastra-dynamic-agents

# Install dependencies
bun install

# Start the development server
agentuity dev
```

## Deployment

```bash
# Navigate to the agent directory
cd mastra-dynamic-agents

# Deploy the agent
agentuity deploy
```

## How It Works

The agent dynamically adjusts its behavior based on contextual input:

1. **Context Detection**: Analyzes user input to determine context (user tier, language)
2. **Dynamic Instructions**: Agent instructions change based on the detected context
3. **Contextual Response**: Provides appropriate level of support based on user tier
4. **Language Adaptation**: Responds in the user's preferred language

## Example Interactions

- **Free Tier User**: "I'm a free tier user, can you help me with basic documentation?"
- **Pro User**: "I'm a pro user, provide detailed technical support"
- **Enterprise**: "I'm an enterprise customer, I need priority assistance"
- **Language**: "Can you help me in Japanese? (ja)"

## Technical Details

The agent demonstrates:
- Dynamic context detection from user input
- Contextual prompt modification based on user tier and language preferences
- Adaptive agent instructions that change behavior based on detected context
- Integration with Agentuity's platform for logging and error handling

This example preserves all original Mastra framework functionality while providing Agentuity's platform integration, error handling, and logging capabilities.
