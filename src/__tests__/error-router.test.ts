import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

vi.mock('../config.js', () => ({
  config: {
    PORT: 3000,
    SESSION_TIMEOUT_MS: 3600000,
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

const mockSend = vi.fn();
const mockWebSocket = {
  send: mockSend,
  on: vi.fn(),
  readyState: 1,
} as any;

describe('ErrorRouter', () => {
  let app: express.Express;
  let sessionManager: typeof import('../session-manager.js').sessionManager;

  beforeEach(async () => {
    vi.resetModules();
    mockSend.mockClear();

    const sessionModule = await import('../session-manager.js');
    sessionManager = sessionModule.sessionManager;

    const { createErrorRouter } = await import('../error-router.js');

    app = express();
    app.use(express.json());
    app.use(createErrorRouter());
  });

  it('should return 400 when workflowId is missing', async () => {
    const response = await request(app)
      .post('/error-callback')
      .send({
        workflowName: 'test',
        errorMessage: 'error',
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('workflowId is required');
  });

  it('should return 404 when no session found for workflowId', async () => {
    const response = await request(app)
      .post('/error-callback')
      .send({
        workflowId: 'non-existent-workflow',
        workflowName: 'test',
        errorMessage: 'error',
        failedNode: 'node1',
        executionId: 'exec-1',
        timestamp: new Date().toISOString(),
      });

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('No session found for workflowId');
  });

  it('should inject error into session when workflow is found', async () => {
    const sessionId = sessionManager.createSession(mockWebSocket);
    sessionManager.registerWorkflow(sessionId, 'my-workflow');

    const response = await request(app)
      .post('/error-callback')
      .send({
        workflowId: 'my-workflow',
        workflowName: 'Test Workflow',
        errorMessage: 'Something went wrong',
        failedNode: 'HTTP Request',
        executionId: 'exec-123',
        timestamp: new Date().toISOString(),
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.sessionId).toBe(sessionId);

    expect(mockSend).toHaveBeenCalled();
    const sentMessage = JSON.parse(mockSend.mock.calls[0][0]);
    expect(sentMessage.type).toBe('workflow_error');
    expect(sentMessage.content).toContain('[WORKFLOW ERROR]');
    expect(sentMessage.content).toContain('Test Workflow');
    expect(sentMessage.content).toContain('my-workflow');
    expect(sentMessage.content).toContain('HTTP Request');
    expect(sentMessage.content).toContain('Something went wrong');
  });

  it('should add error message to session history', async () => {
    const sessionId = sessionManager.createSession(mockWebSocket);
    sessionManager.registerWorkflow(sessionId, 'tracked-workflow');

    await request(app)
      .post('/error-callback')
      .send({
        workflowId: 'tracked-workflow',
        workflowName: 'My Workflow',
        errorMessage: 'Failed to connect',
        failedNode: 'Database Node',
        executionId: 'exec-456',
        timestamp: new Date().toISOString(),
      });

    const messages = sessionManager.getMessages(sessionId);
    expect(messages).toHaveLength(1);
    expect(messages[0].role).toBe('user');
    expect(messages[0].content).toContain('[WORKFLOW ERROR]');
  });
});
