import type { ConnectionStatus as ConnectionStatusType } from '../types';

interface ConnectionStatusProps {
  status: ConnectionStatusType;
  onReconnect: () => void;
}

const statusConfig = {
  connecting: {
    color: 'bg-yellow-500',
    text: 'Connecting...',
    animate: true,
  },
  connected: {
    color: 'bg-green-500',
    text: 'Connected',
    animate: false,
  },
  disconnected: {
    color: 'bg-red-500',
    text: 'Disconnected',
    animate: false,
  },
  reconnecting: {
    color: 'bg-yellow-500',
    text: 'Reconnecting...',
    animate: true,
  },
};

export function ConnectionStatus({ status, onReconnect }: ConnectionStatusProps) {
  const config = statusConfig[status];

  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-2 h-2 rounded-full ${config.color} ${
          config.animate ? 'animate-pulse' : ''
        }`}
      />
      <span className="text-xs text-gray-400">{config.text}</span>
      {status === 'disconnected' && (
        <button
          onClick={onReconnect}
          className="text-xs text-blue-400 hover:text-blue-300"
        >
          Reconnect
        </button>
      )}
    </div>
  );
}
