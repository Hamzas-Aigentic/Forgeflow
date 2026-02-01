import type { WebSocket } from 'ws';
import type { WebSocketMessage, WebSocketResponse } from './types.js';
import { sessionManager } from './session-manager.js';
import { executeClaudeCommand } from './claude-executor.js';
import { logger } from './logger.js';

export function handleWebSocketConnection(ws: WebSocket): void {
  const sessionId = sessionManager.createSession(ws);

  const sessionResponse: WebSocketResponse = {
    type: 'session',
    sessionId,
  };
  ws.send(JSON.stringify(sessionResponse));

  ws.on('message', async (data: Buffer) => {
    try {
      const message: WebSocketMessage = JSON.parse(data.toString());

      if (message.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong' }));
        return;
      }

      if (message.type !== 'message' || !message.content) {
        return;
      }

      const userContent = message.content;
      const history = sessionManager.getMessages(sessionId);

      sessionManager.addMessage(sessionId, {
        role: 'user',
        content: userContent,
        timestamp: new Date(),
      });

      logger.info('Processing message', { sessionId, messageLength: userContent.length });

      let fullResponse = '';
      const generator = executeClaudeCommand(history, userContent);

      let result = await generator.next();
      while (!result.done) {
        const chunk = result.value;
        fullResponse += chunk;

        const chunkResponse: WebSocketResponse = {
          type: 'chunk',
          content: chunk,
        };
        ws.send(JSON.stringify(chunkResponse));

        result = await generator.next();
      }

      const executionResult = result.value;

      for (const workflowId of executionResult.detectedWorkflowIds) {
        sessionManager.registerWorkflow(sessionId, workflowId);
      }

      sessionManager.addMessage(sessionId, {
        role: 'assistant',
        content: executionResult.response,
        timestamp: new Date(),
      });

      const completeResponse: WebSocketResponse = {
        type: 'complete',
        content: executionResult.response,
        workflowIds: executionResult.detectedWorkflowIds,
      };
      ws.send(JSON.stringify(completeResponse));

    } catch (error) {
      logger.error('Error processing WebSocket message', {
        sessionId,
        error: error instanceof Error ? error.message : String(error),
      });

      const errorResponse: WebSocketResponse = {
        type: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      ws.send(JSON.stringify(errorResponse));
    }
  });

  ws.on('close', () => {
    logger.info('WebSocket closed', { sessionId });
    sessionManager.destroySession(sessionId);
  });

  ws.on('error', (error) => {
    logger.error('WebSocket error', {
      sessionId,
      error: error.message,
    });
  });
}
