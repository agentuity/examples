# Agent Approval

Demonstrates [Mastra's agent approval](https://mastra.ai/docs/workflows/human-in-the-loop) patterns ported to Agentuity. Agents sometimes require human-in-the-loop oversight when calling tools that handle sensitive operations, like deleting resources or sending notifications.

## What This Example Shows

This example implements three approval patterns from Mastra:

### 1. Agent-Level Approval (`requireToolApproval`)

All tool calls require approval when enabled. Set `requireToolApproval: true` in the request:

```bash
curl -X POST http://localhost:3500/api/approval \
  -H "Content-Type: application/json" \
  -d '{"text": "What is the weather in London?", "requireToolApproval": true}'
```

Even safe tools like `get_weather` will suspend and require approval.

### 2. Tool-Level Approval (`requireApproval`)

Specific tools are configured to always require approval:

- `delete_user_data` - Permanently deletes user data (destructive)
- `send_notification` - Sends external notifications (side effect)

Safe tools execute immediately:

- `get_weather` - Read-only weather lookup
- `search_records` - Read-only database search

### 3. Suspend with Context

Suspended tool calls include a reason explaining why approval is needed, mirroring Mastra's `suspend({ reason })` pattern. This helps users make informed approve/decline decisions.

## Approval Flow

```
1. POST /api/approval        → Agent determines tool to call
                                → If approval needed: returns suspended response
                                → If no approval: executes tool, returns result

2. GET  /api/approval/pending → Check if there's a pending approval

3. POST /api/approval/approve → Approve: executes tool, returns LLM response
   POST /api/approval/decline → Decline: returns LLM response (no tool execution)

4. GET  /api/approval/history → View past approvals/declines
```

## API Endpoints

### Approval Agent

| Method   | Endpoint              | Description                              |
| -------- | --------------------- | ---------------------------------------- |
| `POST`   | `/api/approval`       | Submit a request (may suspend)           |
| `GET`    | `/api/approval/pending` | Get current pending approval           |
| `POST`   | `/api/approval/approve` | Approve a pending tool call            |
| `POST`   | `/api/approval/decline` | Decline a pending tool call            |
| `GET`    | `/api/approval/history` | Get approval history                   |
| `DELETE` | `/api/approval/history` | Clear approval history                 |
| `GET`    | `/api/approval/stats`   | Get approval statistics                |

### Translation Agent

| Method   | Endpoint                 | Description              |
| -------- | ------------------------ | ------------------------ |
| `POST`   | `/api/translate`         | Translate text           |
| `GET`    | `/api/translate/history` | Get translation history  |
| `DELETE` | `/api/translate/history` | Clear translation history|

## Example: Approve Flow

```bash
# 1. Request that triggers a sensitive tool
curl -X POST http://localhost:3500/api/approval \
  -H "Content-Type: application/json" \
  -d '{"text": "Delete all data for user u123, reason: GDPR request"}'

# Response: { "suspended": true, "pendingApproval": { "toolName": "delete_user_data", ... } }

# 2. Approve the tool call
curl -X POST http://localhost:3500/api/approval/approve

# Response: { "suspended": false, "toolExecuted": "delete_user_data", "response": "..." }
```

## Example: Decline Flow

```bash
# 1. Request that triggers a sensitive tool
curl -X POST http://localhost:3500/api/approval \
  -H "Content-Type: application/json" \
  -d '{"text": "Send an email to user@example.com saying hello"}'

# Response: { "suspended": true, "pendingApproval": { "toolName": "send_notification", ... } }

# 2. Decline the tool call
curl -X POST http://localhost:3500/api/approval/decline

# Response: { "suspended": false, "response": "The notification was not sent..." }
```

## Example: Safe Tool (No Approval)

```bash
curl -X POST http://localhost:3500/api/approval \
  -H "Content-Type: application/json" \
  -d '{"text": "What is the weather in Tokyo?"}'

# Response: { "suspended": false, "toolExecuted": "get_weather", "response": "..." }
```

## Mastra Pattern Mapping

| Mastra Pattern                        | Agentuity Implementation                                  |
| ------------------------------------- | --------------------------------------------------------- |
| `requireToolApproval: true`           | `requireToolApproval` field in agent input                |
| `requireApproval: true` on tool       | `TOOLS_REQUIRING_APPROVAL` set in tools.ts                |
| `suspend({ reason })`                 | `TOOL_SUSPEND_REASONS` map + pending approval state       |
| `agent.approveToolCall({ runId })`    | `POST /api/approval/approve` route                        |
| `agent.declineToolCall({ runId })`    | `POST /api/approval/decline` route                        |
| `finishReason: 'suspended'`           | `suspended: true` in agent output                         |
| `suspendPayload`                      | `pendingApproval` in agent output                         |
| Snapshot storage (LibSQLStore)        | Thread state (`ctx.thread.state`)                         |

## Development

```bash
bun dev        # Start development server at http://localhost:3500
bun run build  # Build for production
bun typecheck  # Run TypeScript type checking
```

## Project Structure

```
agent-approval/
├── src/
│   ├── agent/
│   │   ├── translate/        # Translation agent (baseline)
│   │   │   ├── index.ts
│   │   │   └── eval.ts
│   │   └── approval/         # Approval agent (main example)
│   │       ├── index.ts      # Agent + approve/decline helpers
│   │       ├── tools.ts      # Tool definitions + executors
│   │       └── eval.ts       # Approval behavior evals
│   └── api/
│       └── index.ts          # All API routes
├── app.ts                    # Application entry point
└── package.json
```
