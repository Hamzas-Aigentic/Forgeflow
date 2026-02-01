# Forgeflow Chat UI

A React-based chat interface for the n8n Self-Healing Workflow Builder. Connects to the Bridge Server via WebSocket for real-time streaming conversations with Claude Code.

## Features

- Real-time streaming responses
- Markdown rendering with syntax highlighting
- Code block copy button
- Auto-reconnection with exponential backoff
- Session and workflow tracking
- Dark mode design
- Mobile responsive

## Quick Start

### Prerequisites

- Node.js 20+
- Bridge Server running at localhost:3000

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open http://localhost:5173 in your browser.

### Build

```bash
npm run build
```

### Docker

```bash
docker build -t forgeflow-chat-ui .
docker run -p 80:80 forgeflow-chat-ui
```

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_WS_URL` | ws://localhost:3000/ws | Bridge Server WebSocket URL |

## Project Structure

```
src/
├── components/
│   ├── Chat.tsx          # Main chat container
│   ├── ChatInput.tsx     # Message input with send button
│   ├── ConnectionStatus.tsx  # Connection indicator
│   ├── Message.tsx       # Single message with markdown
│   ├── MessageList.tsx   # Scrollable message list
│   └── Sidebar.tsx       # Session info and workflows
├── hooks/
│   ├── useChat.ts        # Chat state management
│   └── useWebSocket.ts   # WebSocket connection
├── config.ts             # Configuration
├── types.ts              # TypeScript types
├── App.tsx               # Root component
├── main.tsx              # Entry point
└── index.css             # Tailwind styles
```

## Usage

1. Start the Bridge Server (see bridge server README)
2. Start the Chat UI: `npm run dev`
3. Open http://localhost:5173
4. Type a message to start building n8n workflows

### Keyboard Shortcuts

- **Enter**: Send message
- **Shift+Enter**: New line

## License

MIT
