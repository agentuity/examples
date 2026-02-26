# Structured Output

Demonstrates [LangChain's structured output](https://docs.langchain.com/oss/javascript/langchain/agents#structured-output) ported to Agentuity. Uses `model.withStructuredOutput()` with a Zod schema to force typed, structured data from the LLM.

## What This Example Shows

### Zod Schema + withStructuredOutput

Define the output shape and bind it to the model:

```ts
const ContactInfoSchema = z.object({
  name: z.string().describe("Full name of the person"),
  email: z.string().describe("Email address, or 'not found'"),
  phone: z.string().describe("Phone number, or 'not found'"),
  company: z.string().describe("Company name, or 'not found'"),
  role: z.string().describe("Job title, or 'not found'"),
  summary: z.string().describe("Brief summary of the contact"),
});

const structuredModel = model.withStructuredOutput(ContactInfoSchema);
```

### Two-Step Pattern: Gather then Extract

```ts
// Step 1: Agent uses tools to gather information
const result = await agent.invoke({ messages });
const rawResponse = result.messages[...]; // free-form text

// Step 2: Structured extraction — typed output
const contact = await structuredModel.invoke([...]);
// contact.name, contact.email, contact.phone — fully typed!
```

## API Endpoints

| Method | Endpoint    | Description                 |
| ------ | ----------- | --------------------------- |
| `POST` | `/api/chat` | Send a message to the agent |

### Request

```bash
curl -X POST http://localhost:3500/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Look up Jane Doe"}'
```

### Response

```json
{
  "structuredResponse": {
    "name": "Jane Doe",
    "email": "jane@techcorp.com",
    "phone": "555-0101",
    "company": "TechCorp",
    "role": "Senior Engineer",
    "summary": "Jane Doe is a Senior Engineer at TechCorp who leads the platform team."
  },
  "rawResponse": "...",
  "threadId": "...",
  "sessionId": "..."
}
```

## LangChain Pattern Mapping

| LangChain Pattern | Implementation |
|---|---|
| `withStructuredOutput()` | Zod schema bound to model via `model.withStructuredOutput(schema)` |
| Two-step extraction | Agent gathers data with tools, then structured model extracts typed output |
| Tools + structured output | `lookup_person` and `search_company` gather data for extraction |

## Development

```bash
bun dev        # Start development server at http://localhost:3500
bun run build  # Build for production
bun typecheck  # Run TypeScript type checking
```

## Project Structure

```
structured-agent-output/
├── src/
│   ├── agent/
│   │   └── structured-output/
│   │       └── index.ts      # Agent + Zod responseFormat + tools
│   ├── api/
│   │   └── index.ts          # Chat endpoint
│   └── web/
│       ├── App.tsx            # Contact card UI with JSON view
│       ├── App.css            # Tailwind styles
│       ├── frontend.tsx       # React entry point
│       └── index.html         # HTML template
├── app.ts                     # Application entry point
└── package.json
```
