# Mastra Supervisor Agent Example

This example demonstrates a multi-agent supervisor pattern using the Mastra framework. The publisher agent coordinates a copywriter agent and an editor agent to create high-quality blog posts.

## Architecture

- **Copywriter Agent**: Creates initial blog post content
- **Editor Agent**: Refines and edits the content
- **Publisher Agent**: Supervises the workflow, coordinating the copywriter and editor via tools

## Running the Example

1. Install dependencies:
```bash
bun install
```

2. Set your Agentuity SDK key:
```bash
export AGENTUITY_SDK_KEY=your_key_here
```

3. Run in development mode:
```bash
bun run dev
```

## Usage

Send prompts to the agent to generate blog posts on any topic. The supervisor will coordinate the copywriter and editor agents automatically.

Example prompts:
- "Write a blog post about TypeScript best practices"
- "Create a blog post about cloud-native architecture"
