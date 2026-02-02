import type { WebSocket } from 'ws';
import type { WebSocketMessage, WebSocketResponse, ActivityEvent, NotificationPayload } from './types.js';
import { sessionManager } from './session-manager.js';
import { executeClaudeCommand } from './claude-executor.js';
import { logger } from './logger.js';

function generateNotificationId(): string {
  return Math.random().toString(36).substring(2, 15);
}

// Check if a tool event represents a workflow creation
function isWorkflowCreationTool(event: ActivityEvent): boolean {
  return event.toolName === 'mcp__n8n-mcp__n8n_create_workflow';
}

// Check if a tool event represents a workflow update
function isWorkflowUpdateTool(event: ActivityEvent): boolean {
  return event.toolName === 'mcp__n8n-mcp__n8n_update_full_workflow' ||
         event.toolName === 'mcp__n8n-mcp__n8n_update_partial_workflow';
}

// Check if a tool event represents a workflow validation
function isWorkflowValidationTool(event: ActivityEvent): boolean {
  return event.toolName === 'mcp__n8n-mcp__validate_workflow' ||
         event.toolName === 'mcp__n8n-mcp__n8n_validate_workflow';
}

// Generate notification for workflow operations
function createWorkflowNotification(
  event: ActivityEvent,
  success: boolean
): NotificationPayload | null {
  if (event.type !== 'tool_result') return null;

  if (isWorkflowCreationTool(event)) {
    return {
      id: generateNotificationId(),
      type: success ? 'success' : 'error',
      title: success ? 'Workflow Created' : 'Workflow Creation Failed',
      message: success
        ? 'A new workflow has been created successfully.'
        : 'Failed to create workflow. Check the activity log for details.',
      timestamp: new Date(),
    };
  }

  if (isWorkflowUpdateTool(event)) {
    return {
      id: generateNotificationId(),
      type: success ? 'success' : 'error',
      title: success ? 'Workflow Updated' : 'Workflow Update Failed',
      message: success
        ? 'The workflow has been updated successfully.'
        : 'Failed to update workflow. Check the activity log for details.',
      timestamp: new Date(),
    };
  }

  return null;
}

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

      // Track the current tool for result matching
      let currentToolEvent: ActivityEvent | null = null;

      let result = await generator.next();
      while (!result.done) {
        const item = result.value;

        if (item.type === 'text') {
          fullResponse += item.content;

          const chunkResponse: WebSocketResponse = {
            type: 'chunk',
            content: item.content,
          };
          ws.send(JSON.stringify(chunkResponse));
        } else if (item.type === 'activity') {
          const activityEvent = item.event;

          // Send activity event to client
          const activityResponse: WebSocketResponse = {
            type: 'activity',
            activity: activityEvent,
          };
          ws.send(JSON.stringify(activityResponse));

          // Track tool start for matching with result
          if (activityEvent.type === 'tool_start') {
            currentToolEvent = activityEvent;
          }

          // Generate notification for workflow operations
          if (activityEvent.type === 'tool_result' && currentToolEvent) {
            // Copy tool name from the start event to the result
            const enrichedEvent: ActivityEvent = {
              ...activityEvent,
              toolName: currentToolEvent.toolName,
            };

            const notification = createWorkflowNotification(
              enrichedEvent,
              activityEvent.result?.success ?? true
            );

            if (notification) {
              const notificationResponse: WebSocketResponse = {
                type: 'notification',
                notification,
              };
              ws.send(JSON.stringify(notificationResponse));
            }

            currentToolEvent = null;
          }
        }

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
