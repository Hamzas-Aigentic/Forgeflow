# Forgeflow Bridge Server

A WebSocket bridge server that wraps Claude Code CLI, enabling real-time streaming conversations and n8n workflow error handling.

## Features

- **WebSocket API**: Real-time bidirectional communication with Claude Code CLI
- **Session Management**: Maintains conversation history across multiple messages
- **Workflow Tracking**: Automatically detects and tracks n8n workflow IDs created by Claude
- **Error Routing**: Routes n8n workflow errors back to the session that created them
- **Streaming Responses**: Streams Claude's responses in real-time

## Quick Start

### Prerequisites

- Node.js 20+
- Claude Code CLI installed and configured
- Anthropic API key

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Production

```bash
npm run build
npm start
```

### Docker

```bash
docker-compose up --build
```

## API

### WebSocket Endpoint

Connect to `ws://localhost:3000/ws`

#### Client Messages

```json
{
  "type": "message",
  "content": "Your message to Claude"
}
```

```json
{
  "type": "ping"
}
```

#### Server Messages

**Session Created:**
```json
{
  "type": "session",
  "sessionId": "uuid"
}
```

**Response Chunk:**
```json
{
  "type": "chunk",
  "content": "partial response text"
}
```

**Response Complete:**
```json
{
  "type": "complete",
  "content": "full response text",
  "workflowIds": ["workflow-id-1", "workflow-id-2"]
}
```

**Workflow Error (from n8n):**
```json
{
  "type": "workflow_error",
  "content": "[WORKFLOW ERROR] Workflow name (id) failed at node X: error message..."
}
```

**Error:**
```json
{
  "type": "error",
  "error": "error message"
}
```

### HTTP Endpoints

#### Health Check

```
GET /health
```

Response:
```json
{
  "status": "healthy",
  "sessions": 5,
  "timestamp": "2024-01-28T00:00:00.000Z"
}
```

#### Error Callback (for n8n)

```
POST /error-callback
Content-Type: application/json

{
  "workflowId": "workflow-123",
  "workflowName": "My Workflow",
  "errorMessage": "Connection refused",
  "failedNode": "HTTP Request",
  "executionId": "exec-456",
  "timestamp": "2024-01-28T00:00:00.000Z"
}
```

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3000 | Server port |
| `SESSION_TIMEOUT_MS` | 3600000 | Session timeout (1 hour) |
| `CLAUDE_COMMAND` | claude | Claude CLI command |
| `LOG_LEVEL` | info | Log level (debug, info, warn, error) |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Forgeflow Bridge                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐     ┌───────────────────┐                │
│  │   WebSocket  │────▶│  Session Manager  │                │
│  │   Handler    │     │                   │                │
│  └──────────────┘     │  - sessions[]     │                │
│         │             │  - workflowIds    │                │
│         │             └───────────────────┘                │
│         ▼                      ▲                           │
│  ┌──────────────┐              │                           │
│  │    Claude    │              │                           │
│  │   Executor   │──────────────┘                           │
│  └──────────────┘                                          │
│         │                                                  │
│         ▼                                                  │
│  ┌──────────────┐     ┌───────────────────┐                │
│  │   Response   │────▶│   Error Router    │◀── n8n        │
│  │   Parser     │     │  /error-callback  │                │
│  └──────────────┘     └───────────────────┘                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Testing

```bash
npm test
```

## License

MIT
