# Mastra Structured Output

Type-safe structured LLM responses using Mastra's `structuredOutput` with Zod schemas, deployed on Agentuity with `@agentuity/schema` for I/O validation.

## How It Works

**Mastra handles**: structured output generation via `structuredOutput: { schema: DayPlanSchema }` in `agent.generate()`, Zod schema validation, and returning a parsed `result.object`.

**Agentuity handles**: I/O validation with `@agentuity/schema`, plan history in thread state, API routing, and deployment.

## Architecture

```
structured-output/
├── src/
│   ├── agent/
│   │   └── day-planner/
│   │       └── index.ts      # Mastra Agent + Zod schema + structuredOutput
│   ├── api/
│   │   └── index.ts          # Plan + history routes
│   ├── lib/
│   │   └── gateway.ts        # AI Gateway bridge
│   └── web/
│       └── App.tsx           # Planner UI
├── app.ts
└── package.json
```

## Key Code Patterns

### Zod schema for structured output

```typescript
import { z } from 'zod';

const DayPlanSchema = z.object({
  plan: z.array(
    z.object({
      name: z.string().describe('Time block name'),
      activities: z.array(
        z.object({
          name: z.string(),
          startTime: z.string().describe('HH:MM format'),
          endTime: z.string().describe('HH:MM format'),
          description: z.string(),
          priority: z.enum(['high', 'medium', 'low']),
        })
      ),
    })
  ),
  summary: z.string(),
});
```

### Using structuredOutput in generate

```typescript
const result = await plannerMastraAgent.generate(
  `Plan type: ${planType}.\n\n${prompt}`,
  { structuredOutput: { schema: DayPlanSchema } }
);

// result.object is typed and validated against DayPlanSchema
const plan = result.object;
console.log(plan.summary);
console.log(plan.plan[0].activities);
```

### Dual schema approach

```typescript
// Zod schema: used by Mastra for LLM structured output
const DayPlanSchema = z.object({ /* ... */ });

// @agentuity/schema: used for Agentuity API I/O validation
const AgentOutput = s.object({
  plan: s.array(TimeBlockSchema),
  summary: s.string(),
  totalActivities: s.number(),
  history: s.array(HistoryEntrySchema),
});
```

## Example Output

Given: "I have a team meeting, need to finish a report, go to the gym, and have dinner with a friend."

```json
{
  "plan": [
    {
      "name": "Morning",
      "activities": [
        { "name": "Team Meeting", "startTime": "09:00", "endTime": "10:00", "priority": "high" },
        { "name": "Project Report", "startTime": "10:30", "endTime": "12:30", "priority": "high" }
      ]
    },
    {
      "name": "Afternoon",
      "activities": [
        { "name": "Gym Session", "startTime": "14:00", "endTime": "15:30", "priority": "medium" }
      ]
    },
    {
      "name": "Evening",
      "activities": [
        { "name": "Dinner with Friend", "startTime": "19:00", "endTime": "21:00", "priority": "medium" }
      ]
    }
  ],
  "summary": "A balanced day with work in the morning, exercise in the afternoon, and social time in the evening."
}
```

## Commands

```bash
bun dev        # Start dev server at http://localhost:3500
bun run build  # Build for deployment
bun run deploy # Deploy to Agentuity
```

## Related

- [Mastra: Structured Output](https://mastra.ai/docs/agents/structured-output)
- [Agentuity Documentation](https://agentuity.dev)
