import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../config.js', () => ({
  config: {
    PORT: 3000,
    SESSION_TIMEOUT_MS: 1000,
    CLAUDE_COMMAND: 'claude',
    LOG_LEVEL: 'error',
  },
}));

vi.mock('../logger.js', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

const mockWebSocket = {
  send: vi.fn(),
  on: vi.fn(),
  readyState: 1,
} as any;

describe('SessionManager', () => {
  let sessionManager: typeof import('../session-manager.js').sessionManager;

  beforeEach(async () => {
    vi.resetModules();
    const module = await import('../session-manager.js');
    sessionManager = module.sessionManager;
  });

  it('should create a session and return sessionId', () => {
    const sessionId = sessionManager.createSession(mockWebSocket);
    expect(sessionId).toBeDefined();
    expect(typeof sessionId).toBe('string');
    expect(sessionId.length).toBeGreaterThan(0);
  });

  it('should get a session by id', () => {
    const sessionId = sessionManager.createSession(mockWebSocket);
    const session = sessionManager.getSession(sessionId);
    expect(session).not.toBeNull();
    expect(session?.id).toBe(sessionId);
    expect(session?.websocket).toBe(mockWebSocket);
  });

  it('should return null for non-existent session', () => {
    const session = sessionManager.getSession('non-existent-id');
    expect(session).toBeNull();
  });

  it('should register workflow to session', () => {
    const sessionId = sessionManager.createSession(mockWebSocket);
    sessionManager.registerWorkflow(sessionId, 'workflow-123');

    const session = sessionManager.getSession(sessionId);
    expect(session?.workflowIds.has('workflow-123')).toBe(true);
  });

  it('should find session by workflow id', () => {
    const sessionId = sessionManager.createSession(mockWebSocket);
    sessionManager.registerWorkflow(sessionId, 'workflow-456');

    const foundSession = sessionManager.findSessionByWorkflowId('workflow-456');
    expect(foundSession).not.toBeNull();
    expect(foundSession?.id).toBe(sessionId);
  });

  it('should return null when workflow id not found', () => {
    const foundSession = sessionManager.findSessionByWorkflowId('non-existent');
    expect(foundSession).toBeNull();
  });

  it('should add messages to session', () => {
    const sessionId = sessionManager.createSession(mockWebSocket);
    sessionManager.addMessage(sessionId, {
      role: 'user',
      content: 'Hello',
      timestamp: new Date(),
    });

    const messages = sessionManager.getMessages(sessionId);
    expect(messages).toHaveLength(1);
    expect(messages[0].content).toBe('Hello');
  });

  it('should destroy session', () => {
    const sessionId = sessionManager.createSession(mockWebSocket);
    sessionManager.registerWorkflow(sessionId, 'workflow-789');
    sessionManager.destroySession(sessionId);

    expect(sessionManager.getSession(sessionId)).toBeNull();
    expect(sessionManager.findSessionByWorkflowId('workflow-789')).toBeNull();
  });

  it('should cleanup stale sessions', async () => {
    const sessionId = sessionManager.createSession(mockWebSocket);

    await new Promise((resolve) => setTimeout(resolve, 1100));

    const cleaned = sessionManager.cleanupStale();
    expect(cleaned).toBe(1);
    expect(sessionManager.getSession(sessionId)).toBeNull();
  });

  it('should track session count', () => {
    expect(sessionManager.getSessionCount()).toBe(0);
    sessionManager.createSession(mockWebSocket);
    expect(sessionManager.getSessionCount()).toBe(1);
    const sessionId = sessionManager.createSession(mockWebSocket);
    expect(sessionManager.getSessionCount()).toBe(2);
    sessionManager.destroySession(sessionId);
    expect(sessionManager.getSessionCount()).toBe(1);
  });
});
