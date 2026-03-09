# Mastra Network Approval

Network-level tool approval and suspend/resume patterns using Mastra agents, with Agentuity thread state for persisting pending approvals and suspended executions.

## How It Works

**Mastra handles**: agent creation with `maxSteps: 1` for tool call interception, tool definitions with `requireApproval: true`, and conversation continuation via message history.

**Agentuity handles**: persisting pending approvals and suspended executions in thread state, exposing approve/decline/resume API endpoints, tracking operation history, and deployment.

## Three Approval Patterns

| Pattern | When | Example |
|---------|------|---------|
| **Immediate** | Safe tools (research) | `search-web`, `lookup-info` execute immediately |
| **Approval** | Dangerous tools (operations) | `delete-records`, `send-notification` require human approval |
| **Suspend/Resume** | User input needed | `request-confirmation` suspends with options, resumes with user choice |

## Architecture

```
network-approval/
├── src/
│   ├── agent/
│   │   └── network/
│   │       ├── index.ts      # Routing agent + approve/decline/resume helpers
│   │       ├── tools.ts      # 5 tools across 3 sub-agent groups
│   │       └── eval.ts       # Network approval evals
│   ├── api/
│   │   └── index.ts          # Network + approval + suspend routes
│   ├── lib/
│   │   └── gateway.ts        # AI Gateway bridge
│   └── web/
├── app.ts
└── package.json
```

## Key Code Patterns

### Intercepting tool calls with maxSteps: 1

```typescript
// Call with maxSteps: 1 so the LLM picks a tool but doesn't auto-execute
const result = await networkMastraAgent.generate(userMessages, { maxSteps: 1 });

if (result.toolCalls?.length > 0) {
  const toolCall = result.toolCalls[0]!;
  const toolName = toolCall.payload.toolName;

  if (TOOLS_REQUIRING_APPROVAL.has(toolName)) {
    // Store pending approval in thread state
    await ctx.thread.state.set('pendingApproval', { toolName, toolCallId, ... });
    return { suspended: true, suspendType: 'approval' };
  }

  // Safe tool: execute immediately, then feed result back to LLM
  const toolResult = await executeTool(toolName, toolCall.payload.args);
  const response = await networkMastraAgent.generate([...history, toolResultMessage]);
}
```

### Resuming after approval

```typescript
export async function approveNetworkToolCall(pending, thread) {
  const history = JSON.parse(pending.conversationState);
  const toolResult = await executeTool(pending.toolName, JSON.parse(pending.toolArgs));

  // Feed the tool result back into the conversation
  const response = await networkMastraAgent.generate([
    ...history,
    {
      role: 'tool',
      content: [{ type: 'tool-result', toolCallId: pending.toolCallId, toolName: pending.toolName, result: toolResult.data }],
    },
  ]);

  await thread.state.delete('pendingApproval');
  return { response: response.text, suspended: false };
}
```

## API Endpoints

| Method   | Path                     | Description                              |
| -------- | ------------------------ | ---------------------------------------- |
| `POST`   | `/api/network`           | Send request (may suspend)               |
| `GET`    | `/api/network/pending`   | Check for pending approval               |
| `GET`    | `/api/network/suspended` | Check for suspended execution            |
| `POST`   | `/api/network/approve`   | Approve pending tool call                |
| `POST`   | `/api/network/decline`   | Decline pending tool call                |
| `POST`   | `/api/network/resume`    | Resume with user data                    |
| `GET`    | `/api/network/history`   | Get operation history                    |
| `DELETE` | `/api/network/history`   | Clear history and pending state          |
| `GET`    | `/api/network/stats`     | Operation stats by type                  |

## Commands

```bash
bun dev        # Start dev server at http://localhost:3500
bun run build  # Build for deployment
bun run deploy # Deploy to Agentuity
```

## Related

- [Mastra: Agent Networks](https://mastra.ai/docs/agents/networks)
- [Mastra: Human-in-the-Loop](https://mastra.ai/docs/workflows/human-in-the-loop)
- [Agentuity Documentation](https://agentuity.dev)
