# Mastra Voice Capabilities with Agentuity

This example demonstrates how to integrate Mastra's voice capabilities with Agentuity, showcasing both hybrid and unified voice agent approaches.

## Overview

Mastra agents can be enhanced with voice capabilities, enabling them to speak and listen. This example demonstrates two ways to configure voice functionality:

1. **Hybrid Voice Agent**: Uses a composite voice setup that separates input and output streams
2. **Unified Voice Agent**: Uses a unified voice provider that handles both speech-to-text and text-to-speech

Both examples use the OpenAI voice provider for demonstration purposes.

## Prerequisites

This example uses the `openai` model. Make sure to add `OPENAI_API_KEY` to your `.env` file.

```env
OPENAI_API_KEY=<your-api-key>
```

## Installation

```bash
npm install @mastra/voice-openai
```

## Agents

### Hybrid Voice Agent

This agent uses a composite voice setup that separates speech-to-text and text-to-speech functionality. The `CompositeVoice` allows you to configure different providers for listening (input) and speaking (output). However, in this example, both are handled by the same provider: `OpenAIVoice`.

### Unified Voice Agent

This agent uses a single voice provider for both speech-to-text and text-to-speech. If you plan to use the same provider for both listening and speaking, this is a simpler setup. In this example, the `OpenAIVoice` provider handles both functions.

## Usage

Both agents can process text input and generate voice-enabled responses. The voice capabilities are integrated into the Mastra framework while being wrapped in Agentuity's agent interface.

## Development

```bash
# Start development server
agentuity dev

# Build the project
agentuity build

# Deploy to Agentuity Cloud
agentuity deploy
```

## Framework Integration

This example preserves all original Mastra voice framework functionality while wrapping it in Agentuity's agent interface:

- **Mastra Framework**: Handles voice processing, agent logic, and AI model integration
- **Agentuity Wrapper**: Provides platform integration, logging, and standardized request/response handling
- **Voice Capabilities**: Maintained through Mastra's voice providers without modification

The implementation follows Agentuity's framework integration patterns while keeping the original Mastra voice capabilities intact.
