# Forgeflow

**AI-Powered n8n Workflow Builder with Self-Healing Capabilities**

Forgeflow bridges Claude Code CLI directly to your n8n instance, enabling you to build, modify, and automatically fix workflows through natural conversation — no more copy-pasting code back and forth.

## The Problem

Building n8n workflows with AI assistants today is painful:

1. **Copy-paste nightmare**: You describe what you want → AI generates JSON → you paste into n8n → it breaks → you copy the error → paste back to AI → get new JSON → repeat endlessly
2. **Context loss**: Each round-trip loses context. The AI doesn't know what it already tried or what your workflow actually looks like now
3. **Manual debugging**: 40-60% of workflow development time is spent debugging, with average errors taking 10-30 minutes to resolve
4. **No live testing**: AI can suggest fixes but can't actually test if they work

## The Solution

Forgeflow eliminates the copy-paste cycle by connecting Claude Code **directly** to your n8n instance:

```
┌─────────────┐     WebSocket      ┌──────────────────┐     MCP      ┌─────────────┐
│   Chat UI   │ ◄────────────────► │  Bridge Server   │ ◄──────────► │  Claude CLI │
│  (React)    │                    │  (Node.js)       │              │  + n8n-mcp  │
└─────────────┘                    └────────┬─────────┘              └──────┬──────┘
                                            │                               │
                                   Error    │                               │ Direct API
                                   Callback │                               │ Access
                                            ▼                               ▼
                                   ┌─────────────────────────────────────────────┐
                                   │              Your n8n Instance              │
                                   │         (Self-hosted or Cloud)              │
                                   └─────────────────────────────────────────────┘
```

**Key capabilities:**
- **Direct integration**: Claude creates, modifies, and tests workflows directly in your n8n instance
- **Real-time streaming**: See Claude's responses as they're generated
- **Automatic error fixing**: When workflows fail, errors route back to Claude for immediate diagnosis and repair
- **Full context**: Claude maintains conversation history and knows exactly what's in your workflows

## How It Works

### Builder Mode
Describe what you want in plain English:

> "Create a workflow that watches a Google Sheet for new rows, enriches the data with company info from Clearbit, and posts a summary to Slack"

Claude will:
1. Plan the workflow architecture
2. Create it directly in your n8n instance using n8n-mcp
3. Configure all nodes with correct parameters
4. Test the workflow
5. Iterate until it works

### Self-Healing Mode
When a workflow fails in production or during testing:

1. n8n's Error Trigger catches the failure
2. Error details are sent to the Bridge Server via HTTP callback
3. Bridge Server routes the error to the Claude session that created the workflow
4. Claude analyzes the error, applies a fix via n8n-mcp, and re-tests
5. You get notified (Slack, email, etc.) when it's fixed

**Auto-fixable errors** (Claude fixes immediately):
- Expression syntax errors
- Missing required fields
- Data type mismatches
- JSON parsing errors
- Null reference handling

**External errors** (Claude explains, you fix):
- Authentication failures (401, 403)
- API rate limiting (429)
- Missing credentials
- Permission/scope issues

## Why This Is a Game Changer

| Traditional Approach | With Forgeflow |
|---------------------|----------------|
| Copy workflow JSON to ChatGPT | Just describe what you want |
| Paste error messages back and forth | Errors auto-route to Claude |
| Manually apply suggested fixes | Claude applies fixes directly |
| Hope the fix works | Claude tests and iterates |
| Lose context between sessions | Full conversation history preserved |
| 10-30 min per error | < 60 seconds for auto-fixable errors |

## Powered By

Forgeflow leverages two exceptional tools by [@czlonkowski](https://github.com/czlonkowski):

### n8n-mcp
[github.com/czlonkowski/n8n-mcp](https://github.com/czlonkowski/n8n-mcp)

MCP (Model Context Protocol) server that gives Claude direct access to your n8n instance:
- Search and discover nodes
- Create, update, delete workflows
- Execute and test workflows
- Validate configurations
- Access execution history

### n8n-skills
[github.com/czlonkowski/n8n-skills](https://github.com/czlonkowski/n8n-skills) | [n8n-skills.com](https://www.n8n-skills.com/)

Knowledge base that makes Claude an n8n expert with 7 specialized skills:
- **Expression Syntax**: Correct `{{ $json.field }}` patterns
- **MCP Tools Expert**: Optimal tool selection and validation
- **Workflow Patterns**: Proven architectures (webhook, API, database, AI agent, scheduled)
- **Validation Expert**: Error interpretation and false positive detection
- **Node Configuration**: Operation-specific requirements and dependencies
- **Code (JavaScript)**: Data access patterns and built-in functions
- **Code (Python)**: When and how to use Python nodes

Together, n8n-mcp + n8n-skills transform Claude into a workflow building and debugging expert that actually implements changes rather than just suggesting them.

## Requirements

- **Node.js 20+**
- **Claude Code CLI** installed and configured ([docs](https://docs.anthropic.com/en/docs/claude-code))
- **n8n instance** (self-hosted or cloud — **not** locally hosted on your device)
- **n8n-mcp** configured in Claude Code
- **n8n-skills** loaded in Claude Code

### Why not local n8n?

The error callback system requires n8n to reach the Bridge Server via HTTP. If n8n runs locally on your machine, it can't call back to the server. Use:
- [n8n Cloud](https://n8n.io/cloud/)
- Self-hosted on a VPS/server
- Docker on a separate machine

## Quick Start

### 1. Install dependencies

```bash
npm install
cd chat-ui && npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your settings
```

### 3. Configure Claude Code with n8n-mcp

Follow the [n8n-mcp setup guide](https://github.com/czlonkowski/n8n-mcp#setup) to connect Claude to your n8n instance.

### 4. Load n8n-skills

Follow the [n8n-skills setup guide](https://github.com/czlonkowski/n8n-skills#installation) to enhance Claude's n8n knowledge.

### 5. Start the Bridge Server

```bash
npm run dev
```

### 6. Start the Chat UI

```bash
cd chat-ui
npm run dev
```

### 7. Open the UI

Navigate to `http://localhost:5173` and start building workflows!

## Setting Up Error Auto-Healing

To enable automatic error fixing, create an Error Handler workflow in n8n:

1. Add an **Error Trigger** node (catches all workflow errors)
2. Add an **HTTP Request** node pointing to your Bridge Server:
   - Method: `POST`
   - URL: `http://your-bridge-server:3000/error-callback`
   - Body:
   ```json
   {
     "workflowId": "{{ $json.workflow.id }}",
     "workflowName": "{{ $json.workflow.name }}",
     "errorMessage": "{{ $json.error.message }}",
     "failedNode": "{{ $json.error.node.name }}",
     "executionId": "{{ $json.execution.id }}",
     "timestamp": "{{ $now.toISO() }}"
   }
   ```
3. Activate the Error Handler workflow

Now when any workflow fails, Claude will automatically attempt to fix it.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Forgeflow Bridge                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐     ┌────────────────────┐               │
│  │  WebSocket       │────►│  Session Manager   │               │
│  │  Handler         │     │                    │               │
│  │                  │     │  - sessions[]      │               │
│  │  /ws             │     │  - workflowIds     │               │
│  └──────────────────┘     │  - history         │               │
│           │               └────────────────────┘               │
│           │                        ▲                           │
│           ▼                        │                           │
│  ┌──────────────────┐              │                           │
│  │  Claude          │──────────────┘                           │
│  │  Executor        │                                          │
│  │                  │  spawns Claude CLI process               │
│  │  stdin/stdout    │  streams responses                       │
│  └──────────────────┘  extracts workflow IDs                   │
│           │                                                    │
│           │                                                    │
│  ┌──────────────────┐     ┌────────────────────┐               │
│  │  Response        │────►│  Error Router      │◄── n8n       │
│  │  Parser          │     │                    │               │
│  │                  │     │  /error-callback   │               │
│  │  detects         │     │  routes errors to  │               │
│  │  workflow IDs    │     │  correct session   │               │
│  └──────────────────┘     └────────────────────┘               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## API Reference

### WebSocket: `ws://localhost:3000/ws`

**Send messages:**
```json
{ "type": "message", "content": "Create a workflow that..." }
```

**Receive:**
```json
{ "type": "session", "sessionId": "uuid" }
{ "type": "chunk", "content": "partial response..." }
{ "type": "complete", "content": "full response", "workflowIds": ["id1"] }
{ "type": "workflow_error", "content": "[WORKFLOW ERROR] ..." }
```

### HTTP Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check with session count |
| `/error-callback` | POST | Receive n8n workflow errors |
| `/api/fix` | POST | Standalone error fixing API |

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3000 | Bridge server port |
| `SESSION_TIMEOUT_MS` | 3600000 | Session timeout (1 hour) |
| `CLAUDE_COMMAND` | claude | Claude CLI command |
| `LOG_LEVEL` | info | Logging level |

## Project Structure

```
forgeflow/
├── src/                    # Bridge Server (TypeScript)
│   ├── server.ts           # Express + WebSocket setup
│   ├── session-manager.ts  # Session & workflow tracking
│   ├── claude-executor.ts  # Claude CLI process management
│   ├── websocket-handler.ts# WebSocket message handling
│   ├── error-router.ts     # n8n error callback routing
│   ├── response-parser.ts  # Workflow ID extraction
│   ├── fix-api.ts          # Standalone fix endpoint
│   └── __tests__/          # Unit tests
├── chat-ui/                # React Frontend
│   ├── src/
│   │   ├── components/     # Chat, Message, Sidebar, etc.
│   │   └── hooks/          # useChat, useWebSocket
│   └── ...
├── Ralph_Prompts/          # Development prompts (for building with Claude)
└── docker-compose.yml      # Container orchestration
```

## Roadmap

- [x] Bridge Server with session management
- [x] React Chat UI with streaming
- [x] Error callback routing
- [ ] **AWS/Cloud deployment** (in progress)
- [ ] Multi-user authentication
- [ ] Workflow templates library
- [ ] Proactive optimization suggestions
- [ ] Team collaboration features

## Running Tests

```bash
npm test
```

## Docker

```bash
docker-compose up --build
```

## Contributing

Contributions welcome! Please read the contributing guidelines first.

## License

MIT

## Acknowledgments

- [n8n-mcp](https://github.com/czlonkowski/n8n-mcp) by [@czlonkowski](https://github.com/czlonkowski)
- [n8n-skills](https://github.com/czlonkowski/n8n-skills) by [@czlonkowski](https://github.com/czlonkowski)
- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) by Anthropic
- [n8n](https://n8n.io/) workflow automation platform
