import { useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import type { Message as MessageType } from '../types';
import 'highlight.js/styles/vs2015.css';

interface MessageProps {
  message: MessageType;
}

interface CodeBlockProps {
  children?: React.ReactNode;
  className?: string;
}

function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  return (
    <button
      onClick={handleCopy}
      className="absolute top-2 right-2 px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded text-gray-300 transition-colors"
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

function CodeBlock({ children, className }: CodeBlockProps) {
  const code = String(children).replace(/\n$/, '');
  const isInline = !className;

  if (isInline) {
    return (
      <code className="bg-gray-700 px-1.5 py-0.5 rounded text-sm">
        {children}
      </code>
    );
  }

  return (
    <div className="relative group">
      <CopyButton code={code} />
      <code className={className}>{children}</code>
    </div>
  );
}

export function Message({ message }: MessageProps) {
  const isUser = message.role === 'user';
  const timestamp = message.timestamp.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div
        className={`max-w-[80%] rounded-lg px-4 py-3 shadow-md ${
          isUser
            ? 'bg-blue-600 text-white'
            : 'bg-gray-800 text-gray-100 border border-gray-700'
        }`}
      >
        <div className="prose prose-invert max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
            components={{
              code: CodeBlock,
              pre: ({ children }) => (
                <pre className="bg-gray-900 rounded-lg overflow-x-auto">
                  {children}
                </pre>
              ),
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
        <div
          className={`text-xs mt-2 ${
            isUser ? 'text-blue-200' : 'text-gray-500'
          } flex items-center gap-2`}
        >
          <span>{timestamp}</span>
          {message.isStreaming && (
            <span className="inline-flex items-center">
              <span className="animate-pulse">●</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
