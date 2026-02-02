import type { ToolCard } from '../types';
import { getToolDisplayName } from '../utils/toolDisplayNames';

interface InlineToolCardProps {
  card: ToolCard;
}

function StatusIcon({ status }: { status: ToolCard['status'] }) {
  if (status === 'running') {
    return (
      <svg
        className="w-3 h-3 text-blue-400 animate-spin"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    );
  }

  if (status === 'success') {
    return (
      <svg
        className="w-3 h-3 text-green-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 13l4 4L19 7"
        />
      </svg>
    );
  }

  // Error status
  return (
    <svg
      className="w-3 h-3 text-red-400"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}

export function InlineToolCard({ card }: InlineToolCardProps) {
  const displayName = getToolDisplayName(card.toolName);

  return (
    <div className="flex justify-center my-2 animate-fadeIn">
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-800/50 border border-gray-700 rounded-full text-xs text-gray-400">
        <StatusIcon status={card.status} />
        <span>{displayName}</span>
        {card.error && (
          <span
            className="text-red-400 truncate max-w-48"
            title={card.error}
          >
            - {card.error}
          </span>
        )}
      </div>
    </div>
  );
}
