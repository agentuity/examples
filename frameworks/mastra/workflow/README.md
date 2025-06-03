# Mastra Weather Workflow

[![Deploy with Agentuity](https://app.agentuity.com/img/deploy.svg)](https://app.agentuity.com/deploy)

## Overview

The Weather Workflow agent demonstrates a more complex workflow that fetches weather data and uses it to plan activities. This example creates a travel expert that analyzes weather forecasts and provides activity recommendations based on the conditions.

## How It Works

The workflow consists of two main steps:

1. **Fetch Weather Step**:

   - Geocodes a city name to coordinates using the Open-Meteo Geocoding API
   - Fetches a multi-day weather forecast from the Open-Meteo API
   - Formats the forecast data with temperature, precipitation probability, and weather conditions
   - Passes the formatted forecast to the next step

2. **Plan Activities Step**:
   - Takes the forecast data from the previous step
   - Uses GPT-4o Mini to analyze the weather conditions
   - Generates activity recommendations based on the forecast
   - Formats the response with detailed daily plans including:
     - Weather summaries
     - Morning and afternoon outdoor activities
     - Indoor alternatives for bad weather
     - Special considerations based on conditions

The workflow demonstrates:

- Creating a multi-step workflow with dependencies
- Fetching and processing external data
- Using AI to generate recommendations based on structured data
- Formatting complex responses with specific templates

## Running Locally

To run this agent locally:

```bash
# Navigate to the agent directory
cd mastra-weather-workflow

# Install dependencies
npm install

# Run the agent locally
agentuity run
```

You can test the agent by sending it a text prompt with a city name, like "London" or "Tokyo".

## Deployment

To deploy this agent to Agentuity Cloud:

```bash
# Navigate to the agent directory
cd mastra-weather-workflow

# Deploy the agent
agentuity deploy
```

After deployment, you can access your agent through the Agentuity Cloud dashboard.

## Additional Documentation

For more information about Agentuity and its capabilities, visit [https://agentuity.dev/](https://agentuity.dev/).
