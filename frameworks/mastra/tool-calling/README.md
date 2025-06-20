# Mastra Simple Weather

[![Deploy with Agentuity](https://app.agentuity.com/img/deploy.svg)](https://app.agentuity.com/deploy)

## Overview

The Simple Weather agent demonstrates how to create an agent that uses a tool to fetch and provide weather information. This example creates a weather assistant that can provide current weather details for any location.

## How It Works

The agent consists of:

1. **Weather Agent**:

   - Uses GPT-4o Mini with instructions to act as a weather assistant
   - Provides weather information for specific locations
   - Formats responses to include relevant details like humidity, wind conditions, and precipitation

2. **Weather Tool**:
   - Geocodes location names to coordinates using the Open-Meteo Geocoding API
   - Fetches current weather data from the Open-Meteo API
   - Formats the weather data for the agent to use
   - Translates weather condition codes to human-readable descriptions

The agent demonstrates how to:

- Create and use tools with Mastra
- Handle user input to determine the location
- Format external API data for AI consumption

## Running Locally

To run this agent locally:

```bash
# Navigate to the agent directory
cd mastra-simple-weather

# Install dependencies
npm install

# Run the agent locally
agentuity run
```

You can test the agent by sending it a text prompt like "What is the weather in Miami?".

## Deployment

To deploy this agent to Agentuity Cloud:

```bash
# Navigate to the agent directory
cd mastra-simple-weather

# Deploy the agent
agentuity deploy
```

After deployment, you can access your agent through the Agentuity Cloud dashboard.

## Additional Documentation

For more information about Agentuity and its capabilities, visit [https://agentuity.dev/](https://agentuity.dev/).
