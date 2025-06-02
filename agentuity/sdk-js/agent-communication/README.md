# Agent Communication Example
[![Deploy with Agentuity](https://app.agentuity.com/img/deploy.svg)](https://app.agentuity.com/deploy)
## Overview
This example demonstrates how to use the agent communication API in the Agentuity JavaScript SDK to send messages between agents.

## How It Works
The agent provides three operations:

1. **Send Message**: Sends a message to a specific agent
   - Accepts `agentId` and `message` parameters
   - Returns a confirmation of the message delivery

2. **Broadcast Message**: Sends a message to all agents in the same project
   - Accepts a `message` parameter
   - Returns confirmations from all receiving agents

3. **Receive Message**: Handles incoming messages from other agents
   - Processes the message content and sender information
   - Returns an acknowledgment with an echo of the received message

## Usage Example
Send a JSON request with the following structure:

```json
// To send a message to a specific agent
{
  "action": "send",
  "agentId": "agent_id_123",
  "message": "Hello from Agent A! I need some data processed."
}

// To broadcast a message to all agents
{
  "action": "broadcast",
  "message": "System maintenance starting in 5 minutes."
}

// Messages received from other agents will be in this format
{
  "message": "Hello from Agent A! I need some data processed.",
  "sender": "agent_id_456",
  "timestamp": "2025-03-08T03:15:30.123Z"
}
```

## Running Locally
To run this agent locally:

```bash
# Navigate to the agent directory
cd agent-communication

# Install dependencies
npm install

# Run the agent locally
agentuity run
```

## Deployment
To deploy this agent to Agentuity Cloud:

```bash
# Navigate to the agent directory
cd agent-communication

# Deploy the agent
agentuity deploy
```

After deployment, you can access your agent through the Agentuity Cloud dashboard.

## Additional Documentation
For more information about Agentuity and its capabilities, visit [https://agentuity.dev/](https://agentuity.dev/).
