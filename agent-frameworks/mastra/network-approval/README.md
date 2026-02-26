# network-approval

Demonstrates [Mastra's network approval](https://mastra.ai/docs/agents/networks) patterns ported to the Agentuity platform. Agent networks can require human-in-the-loop oversight when tools, sub-agents, or workflows within the network require approval or suspend execution.

## Architecture

A **routing agent** coordinates a network of conceptual sub-agents, each with different approval requirements:

| Sub-Agent      | Tools                                  | Behavior                                           |
| -------------- | -------------------------------------- | -------------------------------------------------- |
| Research       | `search_web`, `lookup_info`            | Execute immediately (no approval)                  |
| Operations     | `delete_records`, `send_notification`  | Require approval before execution                  |
| Confirmation   | `request_confirmation`                 | Suspend with context, resume with user-provided data |

## Approval Patterns

### 1. Approving Network Tool Calls

When a tool requires approval (`requireApproval`), the network suspends and returns a `pendingApproval` payload. Approve via `POST /api/network/approve`.

```bash
# Send request (triggers approval-required tool)
curl -X POST localhost:3500/api/network \
  -H 'Content-Type: application/json' \
  -d '{"text": "Delete all expired records"}'

# Approve the pending tool call
curl -X POST localhost:3500/api/network/approve
```

### 2. Declining Network Tool Calls

Decline a pending tool call via `POST /api/network/decline`. The network continues without executing the tool.

```bash
curl -X POST localhost:3500/api/network/decline
```

### 3. Resuming Suspended Networks

When a tool calls `suspend()` with a payload (e.g. confirmation options), the network pauses. Resume with user-provided data via `POST /api/network/resume`.

```bash
# Send request (triggers suspend with confirmation)
curl -X POST localhost:3500/api/network \
  -H 'Content-Type: application/json' \
  -d '{"text": "I need to confirm deleting the old records"}'

# Resume with user confirmation
curl -X POST localhost:3500/api/network/resume \
  -H 'Content-Type: application/json' \
  -d '{"confirmed": true}'
```

### 4. Agent-Level Approval

Set `requireToolApproval: true` to require approval for ALL tool calls, not just specific ones:

```bash
curl -X POST localhost:3500/api/network \
  -H 'Content-Type: application/json' \
  -d '{"text": "Search for AI news", "requireToolApproval": true}'
```

## API Routes

| Method   | Path                      | Description                                       |
| -------- | ------------------------- | ------------------------------------------------- |
| `POST`   | `/api/network`            | Send a request to the network                     |
| `GET`    | `/api/network/pending`    | Check for pending approval                        |
| `GET`    | `/api/network/suspended`  | Check for suspended execution                     |
| `POST`   | `/api/network/approve`    | Approve a pending tool call                       |
| `POST`   | `/api/network/decline`    | Decline a pending tool call                       |
| `POST`   | `/api/network/resume`     | Resume suspended network with user data           |
| `GET`    | `/api/network/history`    | Get network operation history                     |
| `DELETE` | `/api/network/history`    | Clear history and pending state                   |
| `GET`    | `/api/network/stats`      | Get operation stats (counts by type, total tokens) |

## Mastra Concept Mapping

| Mastra Concept                          | Agentuity Implementation                              |
| --------------------------------------- | ----------------------------------------------------- |
| `routingAgent.network()`                | `POST /api/network` (agent handler)                   |
| `agent-execution-approval` event        | `suspended: true, suspendType: "approval"` response   |
| `tool-execution-suspended` event        | `suspended: true, suspendType: "suspend"` response    |
| `approveNetworkToolCall({ runId })`     | `POST /api/network/approve`                           |
| `declineNetworkToolCall({ runId })`     | `POST /api/network/decline`                           |
| `resumeNetwork(data, { runId })`        | `POST /api/network/resume`                            |
| `suspend({ message, action })`          | `getSuspendPayload()` in tools.ts                     |
| `resumeData` in tool execute            | `executeConfirmationTool(args, resumeData)`            |
| `requireToolApproval` agent option      | `requireToolApproval` input field                     |
| `requireApproval` tool option           | `TOOLS_REQUIRING_APPROVAL` set in tools.ts            |
| Sub-agents in network                   | `TOOL_SUB_AGENTS` mapping + `subAgent` field          |
| Network memory/thread                   | Agentuity thread state (`ctx.thread.state`)           |

## Evals

| Eval                          | Type   | Description                                              |
| ----------------------------- | ------ | -------------------------------------------------------- |
| `network-approval-suspension` | binary | Sensitive tools are suspended for approval               |
| `network-suspend-resume`      | binary | Confirmation tools suspend with proper payload           |
| `safe-network-tool-execution` | binary | Safe tools execute without suspension                    |
| `sub-agent-routing`           | binary | Requests route to the correct sub-agent                  |

## Available Commands

```bash
bun dev        # Start development server at http://localhost:3500
bun run build  # Compile application
bun run typecheck  # Run TypeScript type checking
bun run deploy # Deploy to Agentuity cloud
```

## Related

- [Mastra: Agent Networks](https://mastra.ai/docs/agents/networks)
- [Mastra: Network Approval](https://mastra.ai/docs/agents/network-approval)
- [Mastra: Human-in-the-Loop](https://mastra.ai/docs/workflows/human-in-the-loop)
- [Agentuity Documentation](https://agentuity.dev)
