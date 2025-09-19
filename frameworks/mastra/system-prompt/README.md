# Mastra System Prompt Example

This example demonstrates how to use system prompts with the Mastra framework to create a Harry Potter character voice switching agent. The agent can respond as different characters from the Harry Potter universe by dynamically changing its system prompt.

## Features

- **Character Voice Switching**: Responds as different Harry Potter characters (Harry, Hermione, Ron, Dumbledore, Snape, Hagrid, etc.)
- **System Prompt Override**: Uses Mastra's `generate()` method with system/user message arrays to change character voice
- **Default Behavior**: Responds as Harry Potter when no specific character is requested
- **Agentuity Integration**: Wrapped in Agentuity agent structure with proper error handling and logging

## Setup

1. Install dependencies:
```bash
bun install
```

2. Set up your OpenAI API key:
```bash
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY
```

3. Start the development server:
```bash
agentuity dev
```

## Usage

### Default Harry Potter Response
```
What is your favorite room in Hogwarts?
```

### Character-Specific Responses
```
Tell me about your experience at Hogwarts as Hermione Granger.
Describe the Forbidden Forest as Hagrid would.
What do you think of Harry Potter as Draco Malfoy?
```

The agent detects character requests using the pattern "as [Character Name]" and uses system prompts to switch the response style accordingly.

## Implementation Details

- Uses `@mastra/core/agent` for the core agent functionality
- Integrates with `@ai-sdk/openai` for OpenAI model access
- Implements the Agentuity agent wrapper pattern with `welcome()` and default `Agent()` functions
- Handles errors gracefully with proper logging via `ctx.logger`
- Supports both default behavior and system prompt overrides for character switching

## Dependencies

- `@agentuity/sdk`: Agentuity platform integration
- `@mastra/core`: Mastra framework core functionality
- `@ai-sdk/openai`: OpenAI model integration
- `ai`: AI SDK utilities
