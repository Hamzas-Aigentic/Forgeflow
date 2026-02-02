interface ActivityStatusProps {
  status: string | null;
  onExpandClick: () => void;
  activityCount: number;
  isExpanded: boolean;
}

export function ActivityStatus({
  status,
  onExpandClick,
  activityCount,
  isExpanded,
}: ActivityStatusProps) {
  if (!status && activityCount === 0) {
    return null;
  }

  return (
    <div className="bg-gray-800/50 border-b border-gray-700 px-4 py-2 flex items-center justify-between">
      <div className="flex items-center gap-2">
        {status ? (
          <>
            {/* Pulsing indicator dot */}
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            <span className="text-sm text-gray-300">{status}</span>
          </>
        ) : (
          <span className="text-sm text-gray-500">Processing complete</span>
        )}
      </div>

      {activityCount > 0 && (
        <button
          onClick={onExpandClick}
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-200 transition-colors px-2 py-1 rounded hover:bg-gray-700/50"
        >
          <span>{activityCount} {activityCount === 1 ? 'action' : 'actions'}</span>
          <svg
            className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
