export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

export interface WebSocketMessage {
  type: 'session' | 'chunk' | 'complete' | 'error' | 'workflow_error' | 'pong';
  sessionId?: string;
  content?: string;
  workflowIds?: string[];
  error?: string;
}

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';
