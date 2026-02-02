import type { Notification } from '../types';

interface ToastProps {
  notification: Notification;
  onDismiss: () => void;
}

function Toast({ notification, onDismiss }: ToastProps) {
  const bgColor = {
    success: 'bg-green-900/90 border-green-700',
    error: 'bg-red-900/90 border-red-700',
    info: 'bg-blue-900/90 border-blue-700',
  }[notification.type];

  const iconColor = {
    success: 'text-green-400',
    error: 'text-red-400',
    info: 'text-blue-400',
  }[notification.type];

  const Icon = () => {
    switch (notification.type) {
      case 'success':
        return (
          <svg className={`w-5 h-5 ${iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'error':
        return (
          <svg className={`w-5 h-5 ${iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'info':
        return (
          <svg className={`w-5 h-5 ${iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  return (
    <div
      className={`
        ${bgColor}
        ${notification.dismissed ? 'animate-slideOut' : 'animate-slideIn'}
        border rounded-lg shadow-lg p-4 min-w-72 max-w-sm
        flex items-start gap-3
        backdrop-blur-sm
      `}
    >
      <Icon />
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-gray-100">{notification.title}</h4>
        <p className="text-xs text-gray-300 mt-1 line-clamp-2">{notification.message}</p>
      </div>
      <button
        onClick={onDismiss}
        className="text-gray-400 hover:text-gray-200 transition-colors p-1 -mt-1 -mr-1 rounded hover:bg-white/10"
        aria-label="Dismiss notification"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

interface ToastContainerProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ notifications, onDismiss }: ToastContainerProps) {
  // Only show up to 3 notifications at a time
  const visibleNotifications = notifications.slice(0, 3);

  if (visibleNotifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {visibleNotifications.map((notification) => (
        <Toast
          key={notification.id}
          notification={notification}
          onDismiss={() => onDismiss(notification.id)}
        />
      ))}
    </div>
  );
}
