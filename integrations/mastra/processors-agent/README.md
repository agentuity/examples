# Mastra Processors Agent

Input/output processor pipeline for safety using Mastra's built-in processors (PII detection, prompt injection, content moderation, token limiting), deployed on Agentuity.

## How It Works

**Mastra handles**: processor execution pipeline (`inputProcessors` run before the LLM, `outputProcessors` run after), built-in processor classes (`UnicodeNormalizer`, `PromptInjectionDetector`, `PIIDetector`, `ModerationProcessor`, `TokenLimiterProcessor`), and tripwire blocking.

**Agentuity handles**: schema validation, processing metadata in responses, history tracking in thread state, and deployment.

## Architecture

```
processors-agent/
├── src/
│   ├── agent/
│   │   └── moderated/
│   │       ├── index.ts      # Mastra Agent with input/output processors
│   │       └── eval.ts       # Processor behavior evals
│   ├── api/
│   │   └── index.ts          # Moderated routes + stats
│   ├── lib/
│   │   └── gateway.ts        # AI Gateway bridge
│   └── web/
├── app.ts
└── package.json
```

## Key Code Patterns

### Mastra Agent with processors

```typescript
import { Agent } from '@mastra/core/agent';
import {
  UnicodeNormalizer,
  PromptInjectionDetector,
  PIIDetector,
  ModerationProcessor,
  TokenLimiterProcessor,
} from '@mastra/core/processors';

const moderatedMastraAgent = new Agent({
  id: 'moderated-agent',
  name: 'Moderated Agent',
  instructions: 'You are a helpful assistant.',
  model: 'openai/gpt-5-nano',
  inputProcessors: [
    new UnicodeNormalizer({ stripControlChars: true, collapseWhitespace: true }),
    new PromptInjectionDetector({
      model: 'openai/gpt-5-nano',
      threshold: 0.8,
      strategy: 'rewrite',
      detectionTypes: ['injection', 'jailbreak', 'system-override'],
    }),
    new PIIDetector({
      model: 'openai/gpt-5-nano',
      strategy: 'redact',
      detectionTypes: ['email', 'phone', 'credit-card'],
    }),
    new ModerationProcessor({
      model: 'openai/gpt-5-nano',
      categories: ['hate', 'harassment', 'violence', 'self-harm'],
      threshold: 0.7,
      strategy: 'block',
    }),
  ],
  outputProcessors: [
    new TokenLimiterProcessor({ limit: 1000, strategy: 'truncate' }),
    new ModerationProcessor({
      model: 'openai/gpt-5-nano',
      categories: ['hate', 'harassment', 'violence'],
      threshold: 0.7,
      strategy: 'block',
    }),
  ],
});
```

### Checking for tripwire blocks

```typescript
const result = await moderatedMastraAgent.generate(text);

if (result.tripwire) {
  return {
    response: result.tripwire.reason,
    success: false,
    processingMetadata: { blocked: true, blockedReason: result.tripwire.reason },
  };
}
```

## Processor Pipeline

```
User input
  -> UnicodeNormalizer (strip control chars, collapse whitespace)
  -> PromptInjectionDetector (detect + rewrite injection attempts)
  -> PIIDetector (detect + redact email/phone/credit-card)
  -> ModerationProcessor (block hate/harassment/violence)
  -> LLM generates response
  -> TokenLimiterProcessor (truncate to 1000 tokens)
  -> ModerationProcessor (block harmful output)
  -> Final response
```

## API Endpoints

| Method   | Endpoint              | Description                    |
| -------- | --------------------- | ------------------------------ |
| `POST`   | `/api/moderated`      | Process text through pipeline  |
| `GET`    | `/api/moderated/history` | Get processing history      |
| `DELETE` | `/api/moderated/history` | Clear history               |
| `GET`    | `/api/moderated/stats`   | Get processing statistics   |

## Commands

```bash
bun dev        # Start dev server at http://localhost:3500
bun run build  # Build for deployment
bun run deploy # Deploy to Agentuity
```

## Related

- [Mastra: Processors](https://mastra.ai/docs/agents/processors)
- [Agentuity Documentation](https://agentuity.dev)
