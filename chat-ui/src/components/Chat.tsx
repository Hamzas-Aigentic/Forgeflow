import { useChat } from '../hooks/useChat';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { ConnectionStatus } from './ConnectionStatus';
import { Sidebar } from './Sidebar';

export function Chat() {
  const {
    messages,
    workflowIds,
    isLoading,
    sessionId,
    connectionStatus,
    error,
    sendMessage,
    clearChat,
    reconnect,
  } = useChat();

  return (
    <div className="flex h-screen bg-gray-900">
      <Sidebar
        sessionId={sessionId}
        workflowIds={workflowIds}
        onNewSession={clearChat}
      />

      <div className="flex-1 flex flex-col">
        <header className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-gray-100 font-medium">Chat</h2>
            <ConnectionStatus status={connectionStatus} onReconnect={reconnect} />
          </div>
          {error && (
            <div className="text-red-400 text-sm bg-red-900/30 px-3 py-1 rounded">
              {error}
            </div>
          )}
        </header>

        <MessageList messages={messages} isLoading={isLoading} />

        <ChatInput
          onSend={sendMessage}
          disabled={isLoading || connectionStatus !== 'connected'}
        />
      </div>
    </div>
  );
}
