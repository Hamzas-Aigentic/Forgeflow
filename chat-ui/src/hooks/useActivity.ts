import { useState, useCallback, useEffect, useRef } from 'react';
import type { ActivityEvent, Notification } from '../types';
import { getToolActiveVerb } from '../utils/toolDisplayNames';

const MAX_ACTIVITIES = 100;
const AUTO_DISMISS_SUCCESS_MS = 5000;
const AUTO_DISMISS_ERROR_MS = 8000;

interface UseActivityReturn {
  currentStatus: string | null;
  activities: ActivityEvent[];
  notifications: Notification[];
  isExpanded: boolean;
  toggleExpanded: () => void;
  addActivity: (event: ActivityEvent) => void;
  addNotification: (notification: Notification) => void;
  dismissNotification: (id: string) => void;
  clearActivities: () => void;
  clearAll: () => void;
}

export function useActivity(): UseActivityReturn {
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<string | null>(null);

  // Track active tool for status updates
  const activeToolRef = useRef<string | null>(null);

  // Auto-dismiss timers for notifications
  const dismissTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      dismissTimersRef.current.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  const addActivity = useCallback((event: ActivityEvent) => {
    // Update current status based on event type
    if (event.type === 'tool_start' && event.toolName) {
      activeToolRef.current = event.toolName;
      setCurrentStatus(getToolActiveVerb(event.toolName));
    } else if (event.type === 'tool_result') {
      activeToolRef.current = null;
      setCurrentStatus(null);
    }

    // Add to activity log
    setActivities((prev) => {
      const updated = [event, ...prev];
      // Cap at max activities
      if (updated.length > MAX_ACTIVITIES) {
        return updated.slice(0, MAX_ACTIVITIES);
      }
      return updated;
    });
  }, []);

  const addNotification = useCallback((notification: Notification) => {
    setNotifications((prev) => {
      // Avoid duplicates
      if (prev.some((n) => n.id === notification.id)) {
        return prev;
      }
      return [notification, ...prev];
    });

    // Set auto-dismiss timer
    const dismissTime = notification.type === 'error' ? AUTO_DISMISS_ERROR_MS : AUTO_DISMISS_SUCCESS_MS;
    const timer = setTimeout(() => {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, dismissed: true } : n))
      );
      // Remove from DOM after animation
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
      }, 300);
    }, dismissTime);

    dismissTimersRef.current.set(notification.id, timer);
  }, []);

  const dismissNotification = useCallback((id: string) => {
    // Clear the auto-dismiss timer
    const timer = dismissTimersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      dismissTimersRef.current.delete(id);
    }

    // Mark as dismissed for animation
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, dismissed: true } : n))
    );

    // Remove from DOM after animation
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 300);
  }, []);

  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const clearActivities = useCallback(() => {
    setActivities([]);
    setCurrentStatus(null);
    activeToolRef.current = null;
  }, []);

  const clearAll = useCallback(() => {
    clearActivities();
    // Clear all notification timers
    dismissTimersRef.current.forEach((timer) => clearTimeout(timer));
    dismissTimersRef.current.clear();
    setNotifications([]);
  }, [clearActivities]);

  return {
    currentStatus,
    activities,
    notifications,
    isExpanded,
    toggleExpanded,
    addActivity,
    addNotification,
    dismissNotification,
    clearActivities,
    clearAll,
  };
}
