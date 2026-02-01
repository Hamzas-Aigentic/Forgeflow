interface SidebarProps {
  sessionId: string | null;
  workflowIds: string[];
  onNewSession: () => void;
}

export function Sidebar({ sessionId, workflowIds, onNewSession }: SidebarProps) {
  return (
    <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-lg font-semibold text-gray-100">Forgeflow</h1>
        <p className="text-xs text-gray-500 mt-1">n8n Workflow Builder</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Session
          </h2>
          {sessionId ? (
            <div className="text-xs text-gray-400 font-mono bg-gray-900 px-2 py-1 rounded break-all">
              {sessionId}
            </div>
          ) : (
            <div className="text-xs text-gray-500">Not connected</div>
          )}
        </div>

        <div>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Workflows ({workflowIds.length})
          </h2>
          {workflowIds.length > 0 ? (
            <ul className="space-y-1">
              {workflowIds.map((id) => (
                <li
                  key={id}
                  className="text-xs text-gray-400 font-mono bg-gray-900 px-2 py-1 rounded truncate"
                  title={id}
                >
                  {id}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-gray-500">No workflows yet</p>
          )}
        </div>
      </div>

      <div className="p-4 border-t border-gray-700">
        <button
          onClick={onNewSession}
          className="w-full bg-gray-700 hover:bg-gray-600 text-gray-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          New Session
        </button>
      </div>
    </div>
  );
}
