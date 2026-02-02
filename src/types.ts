import type { WebSocket } from 'ws';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface Session {
  id: string;
  websocket: WebSocket;
  messages: Message[];
  workflowIds: Set<string>;
  createdAt: Date;
  lastActivity: Date;
}

export interface ErrorCallbackPayload {
  workflowId: string;
  workflowName: string;
  errorMessage: string;
  failedNode: string;
  executionId: string;
  timestamp: string;
}

export interface ClaudeStreamChunk {
  type: string;
  content?: string;
  text?: string;
}

export interface ClaudeExecutionResult {
  response: string;
  detectedWorkflowIds: string[];
}

export interface WebSocketMessage {
  type: 'message' | 'ping';
  content?: string;
}

export interface WebSocketResponse {
  type: 'session' | 'chunk' | 'complete' | 'error' | 'workflow_error' | 'activity' | 'notification';
  sessionId?: string;
  content?: string;
  workflowIds?: string[];
  error?: string;
  activity?: ActivityEvent;
  notification?: NotificationPayload;
}

export interface FixRequest {
  workflowId: string;
  workflowName: string;
  errorMessage: string;
  failedNode?: string;
  executionId?: string;
}

export interface FixResponse {
  success: boolean;
  workflowId: string;
  diagnosis: string;
  fixApplied: string;
  summary: string;
  error?: string;
  fullResponse?: string;
}

// Activity tracking types
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

export interface NotificationPayload {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
  workflowId?: string;
  timestamp: Date;
}

// Generator yield types
export interface TextYield {
  type: 'text';
  content: string;
}

export interface ActivityYield {
  type: 'activity';
  event: ActivityEvent;
}

export type ExecutorYield = TextYield | ActivityYield;
