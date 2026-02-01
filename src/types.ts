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
  type: 'session' | 'chunk' | 'complete' | 'error' | 'workflow_error';
  sessionId?: string;
  content?: string;
  workflowIds?: string[];
  error?: string;
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
