# Phase A: Bridge Server Core

## Overview
Build the core bridge server that wraps Claude Code CLI as a WebSocket service. This is the foundation that connects the UI to Claude Code and routes n8n error callbacks.

## Estimated Iterations
70 max

## Dependencies
None - this is the starting phase

---

## Ralph Prompt

```
/ralph-loop:ralph-loop "Build a Bridge Server that wraps Claude Code CLI as a WebSocket service.

CONTEXT:
- Claude Code CLI supports piping via stdin with the -p flag
- Example: echo 'message' | claude -p
- Claude Code has n8n MCP configured, can create/modify workflows
- n8n Error Trigger workflow will POST errors to /error-callback with workflowId

ARCHITECTURE:
- Stateless execution: each message spawns new claude -p with full history
- Session tracks conversation history AND which workflowIds it has touched
- Error callbacks route to session that owns that workflowId

REQUIREMENTS:

1. Core Server (src/server.ts):
   - Express + ws for HTTP and WebSocket
   - WebSocket endpoint at /ws
   - POST /error-callback for n8n errors
   - GET /health for health checks

2. Session Manager (src/session-manager.ts):
   interface Session {
     id: string;
     websocket: WebSocket;
     messages: Message[];
     workflowIds: Set<string>;
     createdAt: Date;
     lastActivity: Date;
   }
   
   - createSession(ws): creates new session, returns sessionId
   - getSession(sessionId): returns session or null
   - findSessionByWorkflowId(workflowId): returns session that owns this workflow
   - registerWorkflow(sessionId, workflowId): adds workflow to session's tracked set
   - destroySession(sessionId): cleanup on disconnect
   - cleanupStale(): removes sessions inactive > 1 hour

3. Claude Executor (src/claude-executor.ts):
   - executeClaudeCommand(history: Message[], newMessage: string): AsyncIterable<string>
   - Spawns: claude -p --output-format stream-json
   - Pipes conversation to stdin
   - Yields response chunks as they stream
   - Returns { response: string, detectedWorkflowIds: string[] }

4. Response Parser (src/response-parser.ts):
   - Parses Claude Code output for workflow operations
   - Detects patterns like 'Created workflow: abc123' or 'Updated workflow xyz789'
   - Extracts workflowIds for session tracking

5. Error Router (src/error-router.ts):
   - POST /error-callback body: { workflowId, workflowName, errorMessage, failedNode, executionId, timestamp }
   - Looks up session via findSessionByWorkflowId(workflowId)
   - If found: injects error as new message into that session's conversation
   - If not found: log warning
   - Error injection format:
     '[WORKFLOW ERROR] Workflow ${workflowName} (${workflowId}) failed at node ${failedNode}: ${errorMessage}. Please diagnose and fix this error using the n8n MCP tools.'

6. WebSocket Handler (src/websocket-handler.ts):
   - On connection: create session, send sessionId to client
   - On message: execute claude, stream response, parse for workflowIds, register them
   - On close: destroy session

7. Config (src/config.ts):
   - PORT (default 3000)
   - SESSION_TIMEOUT_MS (default 1 hour)
   - CLAUDE_COMMAND (default 'claude')
   - LOG_LEVEL

FILES TO CREATE:
- src/server.ts
- src/session-manager.ts
- src/claude-executor.ts
- src/response-parser.ts
- src/error-router.ts
- src/websocket-handler.ts
- src/types.ts
- src/config.ts
- src/logger.ts
- package.json (express, ws, typescript, tsx, vitest)
- tsconfig.json
- Dockerfile
- docker-compose.yml
- .env.example
- README.md

TESTING (src/__tests__/):
- session-manager.test.ts
- response-parser.test.ts
- error-router.test.ts

SUCCESS CRITERIA:
- npm run dev starts server on port 3000
- WebSocket connection at ws://localhost:3000/ws works
- Send message -> receive streamed response
- Multiple messages maintain conversation context
- When Claude creates a workflow, workflowId is tracked to session
- POST /error-callback with workflowId routes to correct session
- Error appears in that session's conversation
- Docker builds and runs
- Tests pass

OUTPUT <promise>BRIDGE_COMPLETE</promise> when all criteria met." --max-iterations 70 --completion-promise "BRIDGE_COMPLETE"
```

---

## Verification Steps

After completion, verify manually:

```bash
# Start the server
npm run dev

# Test health endpoint
curl http://localhost:3000/health

# Test WebSocket (in another terminal)
wscat -c ws://localhost:3000/ws

# Test error callback
curl -X POST http://localhost:3000/error-callback \
  -H "Content-Type: application/json" \
  -d '{"workflowId": "test123", "workflowName": "Test", "errorMessage": "Test error", "failedNode": "HTTP Request"}'
```
