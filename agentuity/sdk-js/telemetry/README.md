# Telemetry Example

[![Deploy with Agentuity](https://app.agentuity.com/img/deploy.svg)](https://app.agentuity.com/deploy)

## Overview

This example demonstrates how to use the telemetry API in the Agentuity JavaScript SDK to monitor and measure agent performance and behavior.

## How It Works

The agent implements telemetry best practices:

1. **Spans**: Creates hierarchical spans to track different phases of request processing

   - Main span for the entire request
   - Child spans for specific operations (data processing, response generation)

2. **Metrics**: Records various metrics to monitor agent behavior

   - Counter for processed requests
   - Histogram for response generation time
   - Counter for errors

3. **Attributes**: Adds contextual information to spans and metrics
   - User ID
   - Request type
   - Error information

## Usage Example

Send a JSON request with the following structure:

```json
{
  "query": "What's the weather like today?",
  "userId": "user123"
}
```

The agent will process the request and return a response with timing information:

```json
{
  "message": "Processed query: What's the weather like today?",
  "timestamp": "2025-03-08T03:15:30.123Z",
  "metrics": {
    "totalProcessingTime": 150,
    "steps": ["process-data", "generate-response"]
  }
}
```

## Running Locally

To run this agent locally:

```bash
# Navigate to the agent directory
cd telemetry

# Install dependencies
npm install

# Run the agent locally
agentuity run
```

## Deployment

To deploy this agent to Agentuity Cloud:

```bash
# Navigate to the agent directory
cd telemetry

# Deploy the agent
agentuity deploy
```

After deployment, you can access your agent through the Agentuity Cloud dashboard.

## Additional Documentation

For more information about Agentuity and its capabilities, visit [https://agentuity.dev/](https://agentuity.dev/).
