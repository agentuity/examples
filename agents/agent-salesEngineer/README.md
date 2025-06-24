# Sales Engineer Agentuity Example

[![Deploy with Agentuity](https://app.agentuity.com/img/deploy.svg)](https://app.agentuity.com/deploy)

The Sales Engineer set of Agents are a system designed to help you efficiently complete Request for Proposal (RFP) documents via a natural conversation. The system is broken down into three agents:

1. Sales Engineer Agent
   - This is the main agent that will be used to carry out a conversation with the user.
2. RFP Schema Agent
   - This agent is responsible for extracting the schema from the RFP document. This allows users to submit their own RFP documents, which the sales engineer agent can then use to talk with them about.
3. RFP Generator Agent
   - This agent is responsible for generating an RFP document based on the requirements of the user and the information gathered from the conversation.

Also included in this project is a simple CLI interface that allows you to interact with the Sales Engineer Agent.

## Quick Start

1. Clone the repository
2. Run `bun install` in the `app` directory to install the dependencies for the CLI interface
3. Run `bun install` in the `agent` directory to install the dependencies for the agents.
4. If you do not already have `agentuity` installed, run `curl -fsS https://agentuity.sh | sh` to install it. Then login with `agentuity login`.
5. Import the project with `agentuity project import` in the `agent` directory.
6. Run `agentuity dev` to start the agents in the `agent` directory.
7. Run `bun run app` in the `app` directory to start the CLI interface.

## Implementation Details

### Sales Engineer Agent

The Sales Engineer Agent is the main agent that will be used to carry out a conversation with the user. It is responsible for:

- Maintaining the state of the conversation.
- Outsourcing document related tasks to the RFP Schema Agent and RFP Generator Agent.

The Sales Engineer Agent expects requests of the format:

```json
{
  "sessionId": "123e4567-e89b-12d3-a456-426614174000",
  "userMessage": "Hello, I need help with my RFP",
  "template": "base64EncodedStringHere (only required on first message)",
  "templateContentType": "application/pdf (only required on first message)"
}
```

And responds with a message of the format:

```json
{
  "message": "Hello, I need help with my RFP",
  "done": false,
  "filledTemplate": "only filled when done"
}
```

### RFP Schema Agent

The RFP Schema Agent is responsible for extracting the schema from the RFP document. This allows users to submit their own RFP documents, which the sales engineer agent can then use to talk with them about.
It accepts documents and returns a JSON object with the schema of the document.

### RFP Generator Agent

The RFP Generator Agent is responsible for generating an RFP document based on the requirements of the user and the information gathered from the conversation. It accepts a JSON object with the schema of the document and returns a markdown document.

### Setting up the Agent URL

The Agentuity environment variables are set by default on project import. However, to use the CLI, you'll need to configure your agent URL:

- **For Local Development**: Use the URL provided by the `agentuity dev` command
- **For Deployed Agents**:
  1. Set the Incoming IO to API instead of Webhook
  2. Set the provided URL in the `SALES_ENGINEER_URL` environment variable
