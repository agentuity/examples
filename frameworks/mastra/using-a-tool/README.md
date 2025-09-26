# Mastra Using a Tool - Agentuity Example

This example demonstrates how to wrap a Mastra agent that uses tools within the Agentuity framework. It preserves the original Mastra framework functionality while providing Agentuity SDK interfaces.

## Overview

This agent uses the Mastra framework to create a London weather assistant that has access to historical weather data for the current year. The agent can answer questions about weather patterns, temperature records, rainfall, and other meteorological data.

## Original Mastra Example

This example is based on the [Mastra "Using a Tool" documentation](https://mastra.ai/en/examples/agents/using-a-tool), which demonstrates how to add tools to Mastra agents.

## Features

- **Historical Weather Data**: Access to year-to-date weather information for London
- **Tool Integration**: Uses Mastra's `createTool` function to define the weather data tool
- **Agentuity Wrapper**: Wrapped with Agentuity SDK for seamless integration
- **Error Handling**: Proper error logging using Agentuity's context logger

## Project Structure

```
src/
├── agents/
│   └── london-weather-agent/
│       └── index.ts          # Main agent implementation
└── tools/
    └── london-weather-tool.ts # Weather data tool definition
```

## Tool Functionality

The `londonWeatherTool` provides:
- Daily temperature maximums and minimums
- Precipitation/rainfall data
- Wind speed measurements
- Snowfall amounts
- Data from January 1st of current year to present

## Usage Examples

- "How many times has it rained this year?"
- "What was the highest temperature recorded this year?"
- "Show me the weather trends for the past month"
- "What's the average rainfall so far this year?"

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   agentuity dev
   ```

3. Test the agent in the Agentuity Console

## Dependencies

- **@mastra/core**: Core Mastra framework for agent and tool creation
- **@ai-sdk/openai**: OpenAI integration for the language model
- **@agentuity/sdk**: Agentuity SDK for request/response handling
- **zod**: Schema validation for tool inputs/outputs

## Implementation Notes

This example follows the Agentuity wrapper pattern:
- Preserves all original Mastra framework imports and functionality
- Uses Agentuity SDK types for request/response handling
- Implements proper error handling with context logging
- Provides a welcome function with example prompts
