# Mastra Multi-Step Workflow

## Overview
The Multi-Step Workflow agent demonstrates how to create a workflow with multiple steps using Mastra. This example implements a blog post creation workflow with two steps: a copywriter agent that writes initial content and an editor agent that refines it.

## How It Works
The workflow consists of two main steps:

1. **Copywriter Step**: 
   - Uses Claude 3.5 Sonnet to generate blog post content based on a provided topic
   - Receives a topic from the trigger data or defaults to "React JavaScript frameworks"
   - Returns the generated content to the next step

2. **Editor Step**: 
   - Uses GPT-4o Mini to edit and refine the content from the copywriter
   - Receives the content from the previous step
   - Returns the edited content as the final result

The workflow demonstrates:
- Step sequencing with dependencies
- Data passing between steps
- Using different AI models for specialized tasks

## Running Locally
To run this agent locally:

```bash
# Navigate to the agent directory
cd mastra-multi-step-workflow

# Install dependencies
npm install

# Run the agent locally
agentuity run
```

You can test the agent by sending it a text prompt with a topic for the blog post.

## Deployment
To deploy this agent to Agentuity Cloud:

```bash
# Navigate to the agent directory
cd mastra-multi-step-workflow

# Deploy the agent
agentuity deploy
```

After deployment, you can access your agent through the Agentuity Cloud dashboard.

## Additional Documentation
For more information about Agentuity and its capabilities, visit [https://agentuity.dev/](https://agentuity.dev/).
