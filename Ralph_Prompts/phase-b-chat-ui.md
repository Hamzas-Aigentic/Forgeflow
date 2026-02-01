# Phase B: Chat UI

## Overview
Build a React-based chat interface that connects to the Bridge Server via WebSocket. This is the user-facing component where you interact with Claude Code to build n8n workflows.

## Estimated Iterations
50 max

## Dependencies
None - can run in parallel with Phase A

---

## Ralph Prompt

```
/ralph-loop:ralph-loop "Build a Chat UI for the n8n Self-Healing Workflow Builder.

CONTEXT:
- Bridge server runs at localhost:3000 (configurable)
- WebSocket endpoint at /ws
- Messages stream in real-time from Claude Code
- This is a developer tool for building n8n workflows conversationally

REQUIREMENTS:

1. Project Setup:
   - React with Vite (fast, simple)
   - TypeScript
   - Tailwind CSS for styling
   - No heavy component libraries needed

2. Core Components:

   src/components/Chat.tsx:
   - Main chat container
   - Manages messages state
   - Handles WebSocket connection lifecycle

   src/components/MessageList.tsx:
   - Renders list of messages
   - Auto-scrolls to bottom on new messages
   - Differentiates user vs assistant messages

   src/components/Message.tsx:
   - Single message display
   - Renders markdown content
   - Syntax highlighting for code blocks (use highlight.js or prism)
   - Timestamps

   src/components/ChatInput.tsx:
   - Textarea for message input (not single-line, workflows need multi-line)
   - Send button
   - Shift+Enter for newline, Enter to send
   - Disabled state while waiting for response

   src/components/ConnectionStatus.tsx:
   - Shows connected/disconnected/reconnecting state
   - Small indicator in corner

   src/components/Sidebar.tsx:
   - Session info display
   - List of workflows touched in this session
   - New session button

3. Hooks:

   src/hooks/useWebSocket.ts:
   - Connects to bridge server
   - Handles reconnection with exponential backoff
   - Returns: { connected, send, lastMessage, error }

   src/hooks/useChat.ts:
   - Manages messages array
   - Handles sending messages via WebSocket
   - Handles incoming message chunks (streaming)
   - Accumulates streaming response into single message

4. Styling:
   - Dark mode default (easier on eyes for devs)
   - Clean, minimal interface
   - Code blocks with dark background
   - User messages right-aligned, assistant left-aligned
   - Responsive (works on tablet, but desktop-first)

5. Features:
   - Streaming responses (characters appear as they arrive)
   - Loading indicator while Claude is responding
   - Error toast if connection fails
   - Session ID displayed (for debugging)
   - Copy button on code blocks
   - Clear chat / new session button

6. Configuration:
   - VITE_WS_URL environment variable for bridge server URL
   - Defaults to ws://localhost:3000/ws

FILES TO CREATE:
- index.html
- src/main.tsx
- src/App.tsx
- src/components/Chat.tsx
- src/components/MessageList.tsx
- src/components/Message.tsx
- src/components/ChatInput.tsx
- src/components/ConnectionStatus.tsx
- src/components/Sidebar.tsx
- src/hooks/useWebSocket.ts
- src/hooks/useChat.ts
- src/types.ts
- src/config.ts
- src/index.css (Tailwind imports)
- tailwind.config.js
- postcss.config.js
- vite.config.ts
- tsconfig.json
- package.json
- Dockerfile (nginx for static serving)
- .env.example
- README.md

SUCCESS CRITERIA:
- npm run dev starts UI on port 5173
- Connects to bridge server WebSocket
- Can send a message and see response
- Response streams in real-time (not all at once)
- Code blocks render with syntax highlighting
- Copy button works on code blocks
- Shows connection status
- Reconnects automatically if connection drops
- Dark mode looks clean and professional
- Works on mobile viewport (basic responsiveness)
- Docker builds and runs (serves on port 80)
- No console errors in normal operation

OUTPUT <promise>UI_COMPLETE</promise> when all criteria met." --max-iterations 50 --completion-promise "UI_COMPLETE"
```

---

## Verification Steps

After completion, verify manually:

```bash
# Start the UI (ensure bridge server is running first)
npm run dev

# Open browser to http://localhost:5173
# Should see:
# - Connection status indicator (green when connected)
# - Chat input at bottom
# - Empty message area

# Test sending a message
# Type "Hello" and press Enter
# Should see your message appear, then Claude's response stream in
```

---

## Parallel Development

To run this in parallel with Phase A:

```bash
# Create separate worktree
git worktree add ../n8n-builder-ui -b feature/chat-ui
cd ../n8n-builder-ui

# Run Ralph prompt
/ralph-loop:ralph-loop "..." --max-iterations 50 --completion-promise "UI_COMPLETE"
```
