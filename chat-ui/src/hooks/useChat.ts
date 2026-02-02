import { useState, useEffect, useCallback, useRef } from 'react';
import { useWebSocket } from './useWebSocket';
import type { Message, WebSocketMessage, ActivityEvent, Notification, ChatItem, ToolCard } from '../types';

interface UseChatOptions {
  onActivity?: (event: ActivityEvent) => void;
  onNotification?: (notification: Notification) => void;
}

interface UseChatReturn {
  chatItems: ChatItem[];
  workflowIds: string[];
  isLoading: boolean;
  sessionId: string | null;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'reconnecting';
  error: string | null;
  sendMessage: (content: string) => void;
  clearChat: () => void;
  reconnect: () => void;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export function useChat(options: UseChatOptions = {}): UseChatReturn {
  const { onActivity, onNotification } = options;

  const [chatItems, setChatItems] = useState<ChatItem[]>([]);
  const [workflowIds, setWorkflowIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const { status, sessionId, lastMessage, error, send, reconnect } = useWebSocket();
  const streamingMessageRef = useRef<string | null>(null);
  const activeToolIdRef = useRef<string | null>(null);

  // Store callbacks in refs to avoid dependency issues
  const onActivityRef = useRef(onActivity);
  const onNotificationRef = useRef(onNotification);

  useEffect(() => {
    onActivityRef.current = onActivity;
  }, [onActivity]);

  useEffect(() => {
    onNotificationRef.current = onNotification;
  }, [onNotification]);

  const processMessage = useCallback((wsMessage: WebSocketMessage) => {
    switch (wsMessage.type) {
      case 'chunk':
        if (wsMessage.content) {
          if (!streamingMessageRef.current) {
            // Start new streaming message
            const newId = generateId();
            streamingMessageRef.current = newId;
            const newMessage: Message = {
              id: newId,
              role: 'assistant',
              content: wsMessage.content,
              timestamp: new Date(),
              isStreaming: true,
            };
            setChatItems((prev) => [...prev, { type: 'message', data: newMessage }]);
          } else {
            // Append to existing streaming message
            setChatItems((prev) =>
              prev.map((item) =>
                item.type === 'message' && item.data.id === streamingMessageRef.current
                  ? { ...item, data: { ...item.data, content: item.data.content + wsMessage.content } }
                  : item
              )
            );
          }
        }
        break;

      case 'complete':
        if (streamingMessageRef.current) {
          setChatItems((prev) =>
            prev.map((item) =>
              item.type === 'message' && item.data.id === streamingMessageRef.current
                ? { ...item, data: { ...item.data, isStreaming: false } }
                : item
            )
          );
          streamingMessageRef.current = null;
        }
        if (wsMessage.workflowIds && wsMessage.workflowIds.length > 0) {
          setWorkflowIds((prev) => {
            const newIds = wsMessage.workflowIds!.filter((id) => !prev.includes(id));
            return [...prev, ...newIds];
          });
        }
        setIsLoading(false);
        break;

      case 'workflow_error':
        if (wsMessage.content) {
          const errorMessage: Message = {
            id: generateId(),
            role: 'assistant',
            content: wsMessage.content,
            timestamp: new Date(),
          };
          setChatItems((prev) => [...prev, { type: 'message', data: errorMessage }]);
        }
        break;

      case 'activity':
        if (wsMessage.activity) {
          // Convert timestamp string to Date if needed
          const event: ActivityEvent = {
            ...wsMessage.activity,
            timestamp: wsMessage.activity.timestamp instanceof Date
              ? wsMessage.activity.timestamp
              : new Date(wsMessage.activity.timestamp),
          };

          if (event.type === 'tool_start' && event.toolName) {
            // Generate toolId if not provided by backend
            const effectiveToolId = event.toolId || `gen-${generateId()}`;

            // Finalize current streaming message if exists and has content
            if (streamingMessageRef.current) {
              setChatItems((prev) => {
                const streamingItem = prev.find(
                  (item) => item.type === 'message' && item.data.id === streamingMessageRef.current
                );
                // Only finalize if the message has actual content
                if (streamingItem && streamingItem.type === 'message' && streamingItem.data.content.trim()) {
                  return prev.map((item) =>
                    item.type === 'message' && item.data.id === streamingMessageRef.current
                      ? { ...item, data: { ...item.data, isStreaming: false } }
                      : item
                  );
                }
                return prev;
              });
              streamingMessageRef.current = null;
            }

            // Insert tool card
            const toolCard: ToolCard = {
              id: generateId(),
              type: 'tool_card',
              toolId: effectiveToolId,
              toolName: event.toolName,
              timestamp: new Date(),
              status: 'running',
            };
            setChatItems((prev) => [...prev, { type: 'tool', data: toolCard }]);
            activeToolIdRef.current = effectiveToolId;
          }

          if (event.type === 'tool_result') {
            // Update the matching tool card
            const toolIdToUpdate = event.toolId || activeToolIdRef.current;
            if (toolIdToUpdate) {
              setChatItems((prev) =>
                prev.map((item) =>
                  item.type === 'tool' && item.data.toolId === toolIdToUpdate
                    ? {
                        ...item,
                        data: {
                          ...item.data,
                          status: event.result?.success ? 'success' : 'error',
                          error: event.result?.error,
                        },
                      }
                    : item
                )
              );
            }
            activeToolIdRef.current = null;
          }

          // Still call onActivityRef for the ActivityFeed/status bar
          if (onActivityRef.current) {
            onActivityRef.current(event);
          }
        }
        break;

      case 'notification':
        if (wsMessage.notification && onNotificationRef.current) {
          // Convert timestamp string to Date if needed
          const notification: Notification = {
            ...wsMessage.notification,
            timestamp: wsMessage.notification.timestamp instanceof Date
              ? wsMessage.notification.timestamp
              : new Date(wsMessage.notification.timestamp),
          };
          onNotificationRef.current(notification);
        }
        break;

      case 'error':
        setIsLoading(false);
        streamingMessageRef.current = null;
        break;
    }
  }, []);

  useEffect(() => {
    if (lastMessage) {
      processMessage(lastMessage);
    }
  }, [lastMessage, processMessage]);

  const sendMessage = useCallback(
    (content: string) => {
      if (!content.trim() || isLoading) return;

      const userMessage: Message = {
        id: generateId(),
        role: 'user',
        content: content.trim(),
        timestamp: new Date(),
      };

      setChatItems((prev) => [...prev, { type: 'message', data: userMessage }]);
      setIsLoading(true);

      send({
        type: 'message',
        content: content.trim(),
      });
    },
    [isLoading, send]
  );

  const clearChat = useCallback(() => {
    setChatItems([]);
    setWorkflowIds([]);
    streamingMessageRef.current = null;
    activeToolIdRef.current = null;
    setIsLoading(false);
    reconnect();
  }, [reconnect]);

  return {
    chatItems,
    workflowIds,
    isLoading,
    sessionId,
    connectionStatus: status,
    error,
    sendMessage,
    clearChat,
    reconnect,
  };
}
