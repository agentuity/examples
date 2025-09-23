# Mastra Weather Agent Example

This example demonstrates how to use Mastra tools within an Agentuity agent to fetch historical weather data for London.

Based on the [Mastra documentation example](https://mastra.ai/en/examples/agents/using-a-tool), this agent uses the Mastra framework to create a weather tool that provides year-to-date historical weather information for London.

## Features

- Historical weather data for London from January 1st to current date
- Temperature, rainfall, snowfall, and wind speed information
- Built using Mastra's tool system integrated with Agentuity

## Running the Example

1. Install dependencies:
   ```bash
   bun install
   ```

2. Start the development server:
   ```bash
   agentuity dev
   ```

3. Test the agent with weather queries like:
   - "How many times has it rained this year in London?"
   - "What was the highest temperature recorded in London this year?"

## Implementation Details

The example includes:
- `src/tools/weather.ts` - Mastra tool for fetching London weather data
- `src/agents/weather-agent/index.ts` - Agentuity agent wrapper that uses the Mastra tool

The agent follows the Agentuity agent contract with `welcome()` and default `Agent()` functions while integrating Mastra's tool system.
