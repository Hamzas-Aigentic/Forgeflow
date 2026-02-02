import type { ActivityEvent } from '../types';
import { getToolDisplayName } from '../utils/toolDisplayNames';

interface ActivityFeedProps {
  activities: ActivityEvent[];
  isExpanded: boolean;
  onClose: () => void;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

function ActivityIcon({ event }: { event: ActivityEvent }) {
  if (event.type === 'tool_start') {
    // Spinning loader
    return (
      <svg
        className="w-4 h-4 text-blue-400 animate-spin"
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

  if (event.type === 'tool_result') {
    if (event.result?.success) {
      // Green checkmark
      return (
        <svg
          className="w-4 h-4 text-green-400"
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
    } else {
      // Red X
      return (
        <svg
          className="w-4 h-4 text-red-400"
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
  }

  // Default info icon
  return (
    <svg
      className="w-4 h-4 text-gray-400"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function ActivityItem({ event }: { event: ActivityEvent }) {
  const displayName = event.toolName ? getToolDisplayName(event.toolName) : 'Unknown action';
  const timestamp = event.timestamp instanceof Date ? event.timestamp : new Date(event.timestamp);

  return (
    <div className="flex items-center gap-3 px-4 py-2 hover:bg-gray-700/30 transition-colors">
      <span className="text-xs text-gray-500 font-mono w-16 flex-shrink-0">
        {formatTime(timestamp)}
      </span>
      <ActivityIcon event={event} />
      <span className="text-sm text-gray-300 truncate flex-1">
        {event.type === 'tool_start' ? displayName : `${displayName} completed`}
      </span>
      {event.type === 'tool_result' && event.result?.error && (
        <span className="text-xs text-red-400 truncate max-w-32" title={event.result.error}>
          {event.result.error}
        </span>
      )}
    </div>
  );
}

export function ActivityFeed({ activities, isExpanded, onClose }: ActivityFeedProps) {
  if (!isExpanded) {
    return null;
  }

  return (
    <div className="bg-gray-850 border-b border-gray-700 max-h-72 overflow-hidden flex flex-col animate-slideDown">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700/50 bg-gray-800/50">
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
          Activity Log
        </span>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-200 transition-colors p-1 rounded hover:bg-gray-700/50"
          aria-label="Close activity feed"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Activity list */}
      <div className="overflow-y-auto flex-1">
        {activities.length === 0 ? (
          <div className="px-4 py-6 text-center text-gray-500 text-sm">
            No activity yet
          </div>
        ) : (
          <div className="divide-y divide-gray-700/30">
            {activities.map((event) => (
              <ActivityItem key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
