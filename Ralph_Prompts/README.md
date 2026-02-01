# n8n Self-Healing Builder - Ralph Wiggum Development Prompts

## Overview

This directory contains phased Ralph Wiggum prompts for building the n8n Self-Healing Workflow Builder. Each phase is a self-contained prompt with clear success criteria.

## Project Summary

Build a hosted Claude Code wrapper that:
- Runs Claude Code in AWS (not locally)
- Exposes it through a chat UI
- Has n8n MCP + n8n-skills MCP pre-configured
- Routes n8n error callbacks back to the running session

## Phases

| Phase | Name | File | Est. Iterations | Dependencies |
|-------|------|------|-----------------|--------------|
| A | Bridge Server Core | [phase-a-bridge-server.md](./phase-a-bridge-server.md) | 70 | None |
| B | Chat UI | [phase-b-chat-ui.md](./phase-b-chat-ui.md) | 50 | None |
| C | Local Integration Testing | [phase-c-integration-testing.md](./phase-c-integration-testing.md) | 40 | A + B |
| D | AWS Infrastructure | [phase-d-aws-infrastructure.md](./phase-d-aws-infrastructure.md) | 60 | C |
| E | CI/CD Pipeline | [phase-e-cicd-pipeline.md](./phase-e-cicd-pipeline.md) | 50 | D |
| F | Production Hardening | [phase-f-production-hardening.md](./phase-f-production-hardening.md) | 50 | E |

**Total estimated iterations:** 320

## Recommended Execution Order

### Option 1: Sequential (Safest)
```
A → B → C → D → E → F
```

### Option 2: Parallel Start (Faster)
```
A ─┬─→ C → D → E → F
B ─┘
```

Run Phase A and B in parallel using git worktrees:

```bash
# Create worktrees
git worktree add ../n8n-builder-bridge -b feature/bridge-server
git worktree add ../n8n-builder-ui -b feature/chat-ui

# Terminal 1: Bridge Server
cd ../n8n-builder-bridge
# Copy and run Phase A prompt

# Terminal 2: Chat UI
cd ../n8n-builder-ui
# Copy and run Phase B prompt

# After both complete, merge and continue with Phase C
```

## Quick Start

### Prerequisites
- Node.js 18+
- Docker
- Claude Code CLI installed and configured
- n8n MCP server configured in Claude Code
- n8n-skills MCP server configured in Claude Code
- AWS account (for Phases D-F)

### Running a Phase

1. Open the phase markdown file
2. Copy the prompt inside the code block
3. Run in Claude Code:

```bash
/ralph-loop:ralph-loop "..." --max-iterations N --completion-promise "PROMISE"
```

### Installing Ralph Plugin

```bash
/plugin install ralph-loop@claude-plugins-official
```

## Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                              AWS                                      │
│                                                                       │
│   ┌─────────────┐     ┌─────────────────────────────────────────┐   │
│   │  CloudFront │     │            ECS Fargate                   │   │
│   │  (Chat UI)  │     │  ┌─────────────────────────────────┐    │   │
│   └──────┬──────┘     │  │        Bridge Server            │    │   │
│          │            │  │                                 │    │   │
│          │            │  │  ┌──────────┐   ┌───────────┐  │    │   │
│   ┌──────▼──────┐     │  │  │ Session  │   │  Claude   │  │    │   │
│   │     S3      │     │  │  │ Manager  │   │ Executor  │  │    │   │
│   │  (Static)   │     │  │  └──────────┘   └─────┬─────┘  │    │   │
│   └─────────────┘     │  │                       │        │    │   │
│                       │  │                 claude -p      │    │   │
│   ┌─────────────┐     │  │                       │        │    │   │
│   │     ALB     │◄────┼──┤  WebSocket ◄──────────┘        │    │   │
│   │ (WebSocket) │     │  │                                │    │   │
│   └──────┬──────┘     │  └─────────────────────────────────┘    │   │
│          │            │                                          │   │
└──────────┼────────────┴──────────────────────────────────────────┘   │
           │                                                            │
           │  /error-callback                                          │
           │                                                            │
    ┌──────▼──────┐         ┌─────────────────┐                        │
    │   n8n       │◄────────│  Error Trigger  │                        │
    │  Instance   │         │    Workflow     │                        │
    └─────────────┘         └─────────────────┘                        │
           │                                                            │
           │  MCP                                                       │
           ▼                                                            │
    ┌─────────────┐                                                     │
    │  Workflows  │                                                     │
    └─────────────┘                                                     │
```

## Files Created Per Phase

### Phase A: Bridge Server
```
bridge-server/
├── src/
│   ├── server.ts
│   ├── session-manager.ts
│   ├── claude-executor.ts
│   ├── response-parser.ts
│   ├── error-router.ts
│   ├── websocket-handler.ts
│   ├── types.ts
│   ├── config.ts
│   ├── logger.ts
│   └── __tests__/
├── package.json
├── tsconfig.json
├── Dockerfile
├── docker-compose.yml
├── .env.example
└── README.md
```

### Phase B: Chat UI
```
chat-ui/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── components/
│   │   ├── Chat.tsx
│   │   ├── MessageList.tsx
│   │   ├── Message.tsx
│   │   ├── ChatInput.tsx
│   │   ├── ConnectionStatus.tsx
│   │   └── Sidebar.tsx
│   ├── hooks/
│   │   ├── useWebSocket.ts
│   │   └── useChat.ts
│   ├── types.ts
│   └── config.ts
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── Dockerfile
└── README.md
```

### Phase D: Infrastructure
```
infrastructure/
├── main.tf
├── variables.tf
├── outputs.tf
├── providers.tf
├── modules/
│   ├── networking/
│   ├── ecs/
│   ├── alb/
│   ├── cloudfront/
│   └── secrets/
└── environments/
    ├── dev.tfvars
    └── prod.tfvars
```

## Tips for Success

1. **Read the full prompt** before running - understand what it's building
2. **Check prerequisites** - ensure MCP servers are configured
3. **Use mock mode** (Phase C) to test without API costs
4. **Verify each phase** manually before proceeding
5. **Keep a FAILURES.md** to track what went wrong for prompt tuning
6. **Set appropriate max-iterations** - don't go too low

## Troubleshooting

### Ralph stop hook error about jq
Install jq: `brew install jq` (macOS) or `apt install jq` (Linux)

### Claude Code not responding
Verify Claude Code works standalone: `echo "Hello" | claude -p`

### WebSocket connection fails
Check bridge server is running and port 3000 is accessible

### Docker build fails
Ensure Docker daemon is running: `docker info`

## Cost Estimates

### Development (API costs)
- Phase A-C: ~$5-20 depending on iterations
- Phase D-F: ~$10-30 depending on iterations

### AWS Infrastructure (monthly)
- ECS Fargate (1 task): ~$30-50
- ALB: ~$20
- CloudFront + S3: ~$5
- NAT Gateway: ~$30
- **Total: ~$85-105/month**

Tip: Destroy dev infrastructure when not testing to save costs.
