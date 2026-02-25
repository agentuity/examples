# Sandbox Code Runner

Generate code in two languages from a single prompt, execute both in parallel sandboxes, compare results side by side.

## Getting Started

```bash
bun install
bun run dev
```

Open [localhost:3500](http://localhost:3500) for the frontend, or [localhost:3500/workbench](http://localhost:3500/workbench) to test the agent directly.

## What's Inside

An agent takes a coding prompt, asks an LLM to generate both TypeScript and Python solutions, then runs them in parallel sandboxes using `ctx.sandbox.run()`:

```typescript
const [tsResult, pyResult] = await Promise.all([
  ctx.sandbox.run({
    runtime: 'bun:1',
    command: {
      exec: ['bun', 'run', 'solution.ts'],
      files: [{ path: 'solution.ts', content: Buffer.from(object.typescript) }],
    },
  }),
  ctx.sandbox.run({
    runtime: 'python:3.14',
    command: {
      exec: ['python', 'solution.py'],
      files: [{ path: 'solution.py', content: Buffer.from(object.python) }],
    },
  }),
]);
```

The frontend picks from three curated prompts (Fibonacci, FizzBuzz, Merge Sort) and displays results in a side-by-side grid with code, output, exit codes, and execution time.

Two evals run in the background after each response:

- **`code-correctness`** (custom): LLM-as-judge eval that scores whether both implementations correctly solve the prompt
- **`conciseness`** (preset): Uses `@agentuity/evals` to check if the generated code is appropriately concise

Eval results appear in the [Agentuity App](https://app.agentuity.com), not in the agent response.

## Project Structure

```
src/
├── agent/code-runner/
│   ├── agent.ts      # LLM code generation + parallel sandbox execution
│   ├── eval.ts       # Custom + preset evals
│   └── index.ts
├── api/index.ts      # POST /api/run
├── lib/
│   ├── types.ts      # Shared I/O schemas (@agentuity/schema)
│   └── prompts.ts    # Curated prompt definitions
└── web/
    ├── App.tsx        # React UI with prompt selector + results grid
    └── ...
```

## Related

- [Sandbox docs](https://agentuity.dev/services/sandbox)
- [Evals docs](https://agentuity.dev/agents/evaluations)
- [Agentuity SDK](https://github.com/agentuity/sdk)
