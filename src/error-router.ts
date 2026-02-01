import type { Router, Request, Response } from 'express';
import { Router as createRouter } from 'express';
import type { ErrorCallbackPayload, WebSocketResponse } from './types.js';
import { sessionManager } from './session-manager.js';
import { logger } from './logger.js';

export function createErrorRouter(): Router {
  const router = createRouter();

  router.post('/error-callback', (req: Request, res: Response) => {
    const payload = req.body as ErrorCallbackPayload;

    if (!payload.workflowId) {
      logger.warn('Error callback received without workflowId');
      res.status(400).json({ error: 'workflowId is required' });
      return;
    }

    const session = sessionManager.findSessionByWorkflowId(payload.workflowId);

    if (!session) {
      logger.warn('No session found for workflow error', { workflowId: payload.workflowId });
      res.status(404).json({ error: 'No session found for workflowId' });
      return;
    }

    const errorMessage = `[WORKFLOW ERROR] Workflow ${payload.workflowName} (${payload.workflowId}) failed at node ${payload.failedNode}: ${payload.errorMessage}. Please diagnose and fix this error using the n8n MCP tools.`;

    sessionManager.addMessage(session.id, {
      role: 'user',
      content: errorMessage,
      timestamp: new Date(),
    });

    const wsResponse: WebSocketResponse = {
      type: 'workflow_error',
      content: errorMessage,
    };

    if (session.websocket.readyState === 1) {
      session.websocket.send(JSON.stringify(wsResponse));
      logger.info('Error injected into session', {
        sessionId: session.id,
        workflowId: payload.workflowId,
      });
    }

    res.json({ success: true, sessionId: session.id });
  });

  return router;
}
