import { useEffect, useRef } from 'react';
import { Message } from './Message';
import { InlineToolCard } from './InlineToolCard';
import type { ChatItem } from '../types';

interface MessageListProps {
  chatItems: ChatItem[];
  isLoading: boolean;
}

export function MessageList({ chatItems, isLoading }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatItems]);

  if (chatItems.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <p className="text-lg mb-2">No messages yet</p>
          <p className="text-sm">
            Start a conversation to build n8n workflows
          </p>
        </div>
      </div>
    );
  }

  // Check if we should show the "thinking" indicator
  // Show it if loading and the last item is a user message
  const lastItem = chatItems[chatItems.length - 1];
  const showThinking = isLoading && lastItem?.type === 'message' && lastItem.data.role === 'user';

  return (
    <div className="flex-1 overflow-y-auto p-4">
      {chatItems.map((item) => {
        if (item.type === 'message') {
          return <Message key={item.data.id} message={item.data} />;
        } else {
          return <InlineToolCard key={item.data.id} card={item.data} />;
        }
      })}
      {showThinking && (
        <div className="flex justify-start mb-4">
          <div className="bg-gray-800 rounded-lg px-4 py-3 text-gray-400">
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
              <span className="text-sm">Claude is thinking...</span>
            </div>
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
