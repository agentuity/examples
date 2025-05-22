# Mastra Bird Checker

## Overview
The Bird Checker agent analyzes images to determine if they contain birds, identify the species, and describe the location. It uses Claude 3 Haiku to analyze random bird-related images fetched from Unsplash.

## How It Works
1. The agent fetches a random image from Unsplash using bird-related search terms (wildlife, feathers, flying, birds)
2. It passes the image to Claude 3 Haiku with instructions to:
   - Determine if the image contains a bird
   - Identify the scientific name of the bird
   - Summarize the location in the picture
3. The agent returns a structured response with:
   - A boolean indicating if a bird is present
   - The species name
   - A brief location description

The agent uses structured output with Zod validation to ensure consistent response formatting.

## Running Locally
To run this agent locally:

```bash
# Navigate to the agent directory
cd mastra-bird-checker

# Install dependencies
npm install

# Set up environment variables
# Create a .env file with your Unsplash API key:
echo "UNSPLASH_ACCESS_KEY=your_unsplash_access_key" > .env

# Run the agent locally
agentuity run
```

## Deployment
To deploy this agent to Agentuity Cloud:

```bash
# Navigate to the agent directory
cd mastra-bird-checker

# Deploy the agent
agentuity deploy
```

After deployment, you can access your agent through the Agentuity Cloud dashboard.

## Additional Documentation
For more information about Agentuity and its capabilities, visit [https://agentuity.dev/](https://agentuity.dev/).
