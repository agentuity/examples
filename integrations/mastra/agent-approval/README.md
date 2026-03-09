# Mastra Agent Approval

Human-in-the-loop tool approval using Mastra's `requireToolApproval` and `approveToolCallGenerate`, with Agentuity thread state for persistence.

## How It Works

**Mastra handles**: tool approval detection (`requireApproval: true` on tools, `requireToolApproval` in generate options), agent suspension (`finishReason === 'suspended'`), and approval resumption (`approveToolCallGenerate` / `declineToolCallGenerate`).

**Agentuity handles**: persisting pending approvals in thread state (`ctx.thread.state`), exposing approve/decline API endpoints, tracking approval history, and deployment.

## Approval Flow

```
1. POST /api/approval         -> Mastra agent picks a tool via LLM
                                -> Tool requires approval? Agent suspends (finishReason: 'suspended')
                                -> Safe tool? Executes immediately

2. GET  /api/approval/pending  -> Retrieve the pending approval from thread state

3. POST /api/approval/approve  -> agent.approveToolCallGenerate({ runId }) resumes execution
   POST /api/approval/decline  -> agent.declineToolCallGenerate({ runId }) skips the tool

4. GET  /api/approval/history  -> View past approvals/declines
```

## Architecture

```
agent-approval/
├── src/
│   ├── agent/
│   │   └── approval/
│   │       ├── index.ts      # Mastra Agent + approve/decline helpers
│   │       ├── tools.ts      # 4 tools (2 safe, 2 require approval)
│   │       └── eval.ts       # Approval behavior evals
│   ├── api/
│   │   └── index.ts          # Approval routes
│   ├── lib/
│   │   └── gateway.ts        # AI Gateway bridge
│   └── web/
├── app.ts
└── package.json
```

## Key Code Patterns

### Tool-level approval

```typescript
const deleteUserDataTool = createTool({
  id: 'delete-user-data',
  description: 'Permanently deletes all data for a user.',
  inputSchema: z.object({
    userId: z.string(),
    reason: z.string(),
  }),
  requireApproval: true,  // This tool always requires approval
  execute: async ({ userId, reason }) => { /* ... */ },
});
```

### Detecting suspension and storing pending approval

```typescript
const result = await approvalMastraAgent.generate(text, { requireToolApproval });

if (result.finishReason === 'suspended' && result.suspendPayload && result.runId) {
  const suspendPayload = result.suspendPayload as {
    toolCallId?: string;
    toolName?: string;
    args?: Record<string, unknown>;
  };
  const toolName = suspendPayload.toolName ?? 'unknown';
  const toolCallId = suspendPayload.toolCallId ?? '';
  const pendingApproval = {
    toolName,
    toolCallId,
    runId: result.runId,
    // ...
  };
  await ctx.thread.state.set('pendingApproval', pendingApproval);
  return { suspended: true, pendingApproval };
}
```

### Approving a suspended tool call

```typescript
const result = await approvalMastraAgent.approveToolCallGenerate({
  runId: pending.runId,
  toolCallId: pending.toolCallId,
});
```

## API Endpoints

| Method   | Endpoint                | Description                    |
| -------- | ----------------------- | ------------------------------ |
| `POST`   | `/api/approval`         | Submit request (may suspend)   |
| `GET`    | `/api/approval/pending` | Get pending approval           |
| `POST`   | `/api/approval/approve` | Approve pending tool call      |
| `POST`   | `/api/approval/decline` | Decline pending tool call      |
| `GET`    | `/api/approval/history` | Get approval history           |
| `DELETE` | `/api/approval/history` | Clear history                  |
| `GET`    | `/api/approval/stats`   | Get approval statistics        |

## Commands

```bash
bun dev        # Start dev server at http://localhost:3500
bun run build  # Build for deployment
bun run deploy # Deploy to Agentuity
```

## Related

- [Mastra: Agent Tool Approval](https://mastra.ai/docs/agents/agent-tool-approval)
- [Agentuity Documentation](https://agentuity.dev)
