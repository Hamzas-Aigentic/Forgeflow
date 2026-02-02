export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

export interface ActivityEvent {
  id: string;
  type: 'tool_start' | 'tool_result' | 'status';
  timestamp: Date;
  toolName?: string;
  toolId?: string;
  result?: {
    success: boolean;
    error?: string;
  };
  message?: string;
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
  workflowId?: string;
  timestamp: Date;
  dismissed?: boolean;
}

export interface WebSocketMessage {
  type: 'session' | 'chunk' | 'complete' | 'error' | 'workflow_error' | 'pong' | 'activity' | 'notification';
  sessionId?: string;
  content?: string;
  workflowIds?: string[];
  error?: string;
  activity?: ActivityEvent;
  notification?: Notification;
}

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';

// Tool card for inline display between messages
export interface ToolCard {
  id: string;
  type: 'tool_card';
  toolId: string;
  toolName: string;
  timestamp: Date;
  status: 'running' | 'success' | 'error';
  error?: string;
}

// Union type for chat items (messages or tool cards)
export type ChatItem =
  | { type: 'message'; data: Message }
  | { type: 'tool'; data: ToolCard };
