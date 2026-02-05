# Structured Output

This example demonstrates how to use structured output with Agentuity agents. Structured output lets an agent return an object that matches a defined schema instead of returning plain text.

## Overview

The Day Planner agent takes a natural language description of your day and returns a structured plan with:
- Time blocks (Morning, Afternoon, Evening)
- Activities with start/end times, descriptions, and priorities
- A summary of the planned day

## When to Use Structured Output

Use structured output when you need an agent to return data objects rather than text. Having well-defined fields makes it simpler to:
- Render data in UI components
- Process results in application logic
- Make API calls with the extracted values
- Store and query the data

## Defining Schemas

Agents define their output structure using `@agentuity/schema`:

```typescript
import { s } from '@agentuity/schema';

// Define nested schemas for complex structures
const ActivitySchema = s.object({
  name: s.string().describe('Name of the activity'),
  startTime: s.string().describe('Start time in HH:MM format'),
  endTime: s.string().describe('End time in HH:MM format'),
  description: s.string().describe('Brief description'),
  priority: s.enum(['high', 'medium', 'low']).describe('Priority level'),
});

const TimeBlockSchema = s.object({
  name: s.string().describe('Time block name'),
  activities: s.array(ActivitySchema).describe('Activities in this block'),
});

// Use in agent output schema
const AgentOutput = s.object({
  plan: s.array(TimeBlockSchema).describe('Structured daily plan'),
  summary: s.string().describe('Brief summary'),
  totalActivities: s.number().describe('Total activities planned'),
});
```

## Project Structure

```
structured-output/
├── src/
│   ├── agent/
│   │   └── day-planner/
│   │       ├── index.ts    # Agent with structured output
│   │       └── eval.ts     # Evaluations for structure validation
│   ├── api/
│   │   └── index.ts        # API routes
│   └── web/
│       ├── App.tsx         # React UI for the planner
│       ├── App.css         # Styling
│       └── index.html      # HTML template
├── package.json
├── tsconfig.json
└── agentuity.json
```

## Key Features

### Schema-Driven Development

The agent uses `@agentuity/schema` to define both input and output shapes:

```typescript
const agent = createAgent('day-planner', {
  description: 'Creates structured daily plans',
  schema: {
    input: AgentInput,   // Validates incoming requests
    output: AgentOutput, // Shapes the response
  },
  handler: async (ctx, input) => {
    // Return data matching AgentOutput schema
    return {
      plan: [...],
      summary: '...',
      totalActivities: 10,
    };
  },
});
```

### JSON Mode with LLMs

The agent uses OpenAI's JSON mode to ensure structured responses:

```typescript
const completion = await client.chat.completions.create({
  model,
  messages: [...],
  response_format: { type: 'json_object' },
});
```

### Type-Safe API Routes

Routes automatically validate input/output against schemas:

```typescript
api.post('/plan', dayPlanner.validator(), async (c) => {
  const data = c.req.valid('json'); // Type-safe, validated input
  return c.json(await dayPlanner.run(data));
});
```

## Running the Example

### Development

```bash
bun dev
```

Starts the development server at `http://localhost:3500`

### Build

```bash
bun build
```

### Deploy

```bash
bun run deploy
```

## Example Output

Given the prompt: "I need to plan a productive day. I have a team meeting in the morning, need to finish a project report, go to the gym, and have dinner with a friend."

The agent returns structured data like:

```json
{
  "plan": [
    {
      "name": "Morning",
      "activities": [
        {
          "name": "Team Meeting",
          "startTime": "09:00",
          "endTime": "10:00",
          "description": "Weekly sync with the team",
          "priority": "high"
        },
        {
          "name": "Project Report",
          "startTime": "10:30",
          "endTime": "12:30",
          "description": "Complete and submit the project report",
          "priority": "high"
        }
      ]
    },
    {
      "name": "Afternoon",
      "activities": [
        {
          "name": "Gym Session",
          "startTime": "14:00",
          "endTime": "15:30",
          "description": "Workout and exercise",
          "priority": "medium"
        }
      ]
    },
    {
      "name": "Evening",
      "activities": [
        {
          "name": "Dinner with Friend",
          "startTime": "19:00",
          "endTime": "21:00",
          "description": "Social dinner at a restaurant",
          "priority": "medium"
        }
      ]
    }
  ],
  "summary": "A balanced day with work tasks in the morning, exercise in the afternoon, and social time in the evening.",
  "totalActivities": 4
}
```

## Evaluations

The example includes evaluations to verify structured output quality:

- **adversarial**: Tests resistance to manipulation attempts
- **structure-valid**: Verifies the output has valid time blocks and activities

## Learn More

- [Agentuity Documentation](https://agentuity.dev)
- [Schema Reference](https://agentuity.dev/docs/schema)
