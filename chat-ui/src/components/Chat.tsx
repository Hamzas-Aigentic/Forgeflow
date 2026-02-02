import { useChat } from '../hooks/useChat';
import { useActivity } from '../hooks/useActivity';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { ConnectionStatus } from './ConnectionStatus';
import { Sidebar } from './Sidebar';
import { ActivityStatus } from './ActivityStatus';
import { ActivityFeed } from './ActivityFeed';
import { ToastContainer } from './Toast';

export function Chat() {
  const {
    currentStatus,
    activities,
    notifications,
    isExpanded,
    toggleExpanded,
    addActivity,
    addNotification,
    dismissNotification,
    clearAll: clearActivity,
  } = useActivity();

  const {
    chatItems,
    workflowIds,
    isLoading,
    sessionId,
    connectionStatus,
    error,
    sendMessage,
    clearChat: baseClearChat,
    reconnect,
  } = useChat({
    onActivity: addActivity,
    onNotification: addNotification,
  });

  // Clear both chat and activity when clearing
  const clearChat = () => {
    baseClearChat();
    clearActivity();
  };

  // Show activity status when loading or there's a current status
  const showActivityStatus = isLoading || currentStatus !== null || activities.length > 0;

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

        {/* Activity status bar - shows current processing status */}
        {showActivityStatus && (
          <ActivityStatus
            status={currentStatus}
            onExpandClick={toggleExpanded}
            activityCount={activities.length}
            isExpanded={isExpanded}
          />
        )}

        {/* Expandable activity feed */}
        <ActivityFeed
          activities={activities}
          isExpanded={isExpanded}
          onClose={toggleExpanded}
        />

        <MessageList chatItems={chatItems} isLoading={isLoading} />

        <ChatInput
          onSend={sendMessage}
          disabled={isLoading || connectionStatus !== 'connected'}
        />
      </div>

      {/* Toast notifications - fixed position */}
      <ToastContainer
        notifications={notifications}
        onDismiss={dismissNotification}
      />
    </div>
  );
}
