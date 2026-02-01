import { useState, useEffect, useCallback, useRef } from 'react';
import { useWebSocket } from './useWebSocket';
import type { Message, WebSocketMessage } from '../types';

interface UseChatReturn {
  messages: Message[];
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

export function useChat(): UseChatReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [workflowIds, setWorkflowIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const { status, sessionId, lastMessage, error, send, reconnect } = useWebSocket();
  const streamingMessageRef = useRef<string | null>(null);

  const processMessage = useCallback((wsMessage: WebSocketMessage) => {
    switch (wsMessage.type) {
      case 'chunk':
        if (wsMessage.content) {
          if (!streamingMessageRef.current) {
            // Start new streaming message
            const newId = generateId();
            streamingMessageRef.current = newId;
            setMessages((prev) => [
              ...prev,
              {
                id: newId,
                role: 'assistant',
                content: wsMessage.content!,
                timestamp: new Date(),
                isStreaming: true,
              },
            ]);
          } else {
            // Append to existing streaming message
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === streamingMessageRef.current
                  ? { ...msg, content: msg.content + wsMessage.content }
                  : msg
              )
            );
          }
        }
        break;

      case 'complete':
        if (streamingMessageRef.current) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === streamingMessageRef.current
                ? { ...msg, isStreaming: false }
                : msg
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
          setMessages((prev) => [
            ...prev,
            {
              id: generateId(),
              role: 'assistant',
              content: wsMessage.content!,
              timestamp: new Date(),
            },
          ]);
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

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      send({
        type: 'message',
        content: content.trim(),
      });
    },
    [isLoading, send]
  );

  const clearChat = useCallback(() => {
    setMessages([]);
    setWorkflowIds([]);
    streamingMessageRef.current = null;
    setIsLoading(false);
    reconnect();
  }, [reconnect]);

  return {
    messages,
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
