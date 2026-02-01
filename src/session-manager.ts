import { v4 as uuidv4 } from 'uuid';
import type { WebSocket } from 'ws';
import type { Session, Message } from './types.js';
import { config } from './config.js';
import { logger } from './logger.js';

class SessionManager {
  private sessions: Map<string, Session> = new Map();
  private workflowToSession: Map<string, string> = new Map();

  createSession(ws: WebSocket): string {
    const id = uuidv4();
    const session: Session = {
      id,
      websocket: ws,
      messages: [],
      workflowIds: new Set(),
      createdAt: new Date(),
      lastActivity: new Date(),
    };
    this.sessions.set(id, session);
    logger.info('Session created', { sessionId: id });
    return id;
  }

  getSession(sessionId: string): Session | null {
    return this.sessions.get(sessionId) || null;
  }

  findSessionByWorkflowId(workflowId: string): Session | null {
    const sessionId = this.workflowToSession.get(workflowId);
    if (!sessionId) {
      return null;
    }
    return this.getSession(sessionId);
  }

  registerWorkflow(sessionId: string, workflowId: string): void {
    const session = this.getSession(sessionId);
    if (session) {
      session.workflowIds.add(workflowId);
      this.workflowToSession.set(workflowId, sessionId);
      logger.info('Workflow registered to session', { sessionId, workflowId });
    }
  }

  addMessage(sessionId: string, message: Message): void {
    const session = this.getSession(sessionId);
    if (session) {
      session.messages.push(message);
      session.lastActivity = new Date();
    }
  }

  getMessages(sessionId: string): Message[] {
    const session = this.getSession(sessionId);
    return session ? [...session.messages] : [];
  }

  destroySession(sessionId: string): void {
    const session = this.getSession(sessionId);
    if (session) {
      for (const workflowId of session.workflowIds) {
        this.workflowToSession.delete(workflowId);
      }
      this.sessions.delete(sessionId);
      logger.info('Session destroyed', { sessionId });
    }
  }

  cleanupStale(): number {
    const now = Date.now();
    let cleaned = 0;
    for (const [sessionId, session] of this.sessions) {
      if (now - session.lastActivity.getTime() > config.SESSION_TIMEOUT_MS) {
        this.destroySession(sessionId);
        cleaned++;
      }
    }
    if (cleaned > 0) {
      logger.info('Cleaned up stale sessions', { count: cleaned });
    }
    return cleaned;
  }

  getSessionCount(): number {
    return this.sessions.size;
  }
}

export const sessionManager = new SessionManager();
