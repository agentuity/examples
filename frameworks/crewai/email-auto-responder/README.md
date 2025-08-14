# CrewAI Email Auto-Responder for Agentuity

This example demonstrates how to wrap a CrewAI email auto-responder flow as an Agentuity agent. The agent analyzes incoming emails, classifies them by urgency and type, determines appropriate actions, and drafts professional responses.

## Features

- **Email Classification**: Analyzes emails for urgency, category, and sender importance
- **Action Determination**: Decides whether emails need human intervention or can be auto-responded
- **Response Drafting**: Creates professional, contextually appropriate email responses
- **Gmail Integration**: Uses Gmail API for email operations and draft creation
- **Multi-Agent Workflow**: Employs three specialized CrewAI agents working in sequence

## Architecture

The system uses three CrewAI agents:

1. **Email Filter Agent**: Analyzes and classifies incoming emails
2. **Email Action Agent**: Determines the appropriate action for each email
3. **Email Response Writer**: Crafts professional responses and drafts

## Setup

### Prerequisites

- Python 3.10 or higher
- Gmail API credentials
- OpenAI API key
- Tavily API key (for web search capabilities)

### Environment Variables

Create a `.env` file with the following variables:

```bash
# OpenAI API Key
OPENAI_API_KEY=your_openai_api_key_here

# Gmail API Configuration
MY_EMAIL=your_email@gmail.com

# Tavily API Key (for web search)
TAVILY_API_KEY=your_tavily_api_key_here

# Gmail API Credentials (JSON file path)
GOOGLE_APPLICATION_CREDENTIALS=path/to/your/gmail_credentials.json
```

### Gmail API Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Gmail API
4. Create credentials (OAuth 2.0 Client ID)
5. Download the credentials JSON file
6. Set the `GOOGLE_APPLICATION_CREDENTIALS` environment variable to the file path

### Installation

```bash
# Install dependencies
uv install

# Run the development server
uv run server.py
```

## Usage

### Basic Email Processing

Send email content to the agent for analysis and response generation:

```
Process this email: 
Subject: Meeting Request
From: client@example.com
Body: Hi, I'd like to schedule a meeting to discuss our project timeline. Are you available next week?
```

### Example Prompts

- "Analyze and respond to: [email content]"
- "Handle this incoming email: [email body]"
- "Process this customer inquiry: [email text]"

## How It Works

1. **Input Processing**: The agent receives email content via Agentuity's request interface
2. **Email Analysis**: The Email Filter Agent classifies the email by urgency, category, and sender importance
3. **Action Planning**: The Email Action Agent determines the appropriate response strategy
4. **Response Generation**: The Email Response Writer creates a professional draft response
5. **Output**: Returns the analysis results and draft response via Agentuity's response interface

## Configuration

### Agent Configuration

The agents are configured in `agents/EmailAutoResponder/config/agents.yaml`:

- **Email Filter Agent**: Specializes in email classification and analysis
- **Email Action Agent**: Focuses on workflow decisions and escalation
- **Email Response Writer**: Expert in professional communication and drafting

### Task Configuration

Tasks are defined in `agents/EmailAutoResponder/config/tasks.yaml`:

- **Filter Emails Task**: Analyzes and classifies incoming emails
- **Action Required Task**: Determines appropriate actions and escalation
- **Draft Responses Task**: Creates professional email responses

## Tools and Integrations

- **Gmail API**: For email operations and draft creation
- **Tavily Search**: For web search capabilities when needed
- **LangChain**: For tool integration and email processing
- **OpenAI GPT-4**: For natural language processing and generation

## Development

### Local Development

```bash
# Start the development server with auto-reload
agentuity dev

# Test the agent in the Agentuity console
# Navigate to the provided local URL
```

### Testing

```bash
# Run any available tests
uv run pytest

# Test email processing with sample data
uv run python -c "
from agents.EmailAutoResponder.agent import run
# Add test code here
"
```

## Deployment

Deploy to Agentuity Cloud:

```bash
agentuity deploy
```

## Customization

### Adding New Email Categories

Modify the classification logic in `config/tasks.yaml` to include additional email categories or urgency levels.

### Custom Response Templates

Extend the Email Response Writer agent to use custom templates for different types of emails.

### Integration with Other Services

Add new tools to integrate with other email services, CRM systems, or notification platforms.

## Troubleshooting

### Common Issues

1. **Gmail API Authentication**: Ensure your credentials are properly configured and the Gmail API is enabled
2. **Missing Environment Variables**: Check that all required API keys are set in your `.env` file
3. **Import Errors**: Verify that all dependencies are installed with `uv install`

### Debugging

Enable verbose logging by setting the CrewAI agents to `verbose=True` in the configuration.

## Contributing

This example follows the Agentuity framework integration patterns. When making changes:

1. Preserve all original CrewAI functionality
2. Follow the established Agentuity wrapper patterns
3. Update documentation for any new features
4. Test thoroughly with various email types

## License

This example is part of the Agentuity examples repository and follows the same licensing terms.
