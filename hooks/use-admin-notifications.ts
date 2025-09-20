// Custom hook for admin-specific notifications including message alerts
import { useState, useEffect, useCallback, useMemo } from 'react';
import { notificationService, Notification } from '@/lib/notifications';

export function useAdminNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load admin notifications (including message alerts)
  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch notifications for the special admin_alerts user ID
      const result = await notificationService.getUserNotifications('admin_alerts', 'admin', 50);
      
      if (result.success && result.notifications) {
        setNotifications(result.notifications);
        const unread = result.notifications.filter(n => !n.read).length;
        setUnreadCount(unread);
      } else {
        setError(result.error || 'Failed to load notifications');
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load notifications on mount
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Subscribe to real-time admin notifications
  useEffect(() => {
    const unsubscribe = notificationService.subscribeToUserNotifications(
      'admin_alerts',
      'admin',
      (newNotification) => {
        console.log('Admin notification received:', newNotification.id);
        
        setNotifications(prev => {
          // Check if this is an update to existing notification or new one
          const existingIndex = prev.findIndex(n => n.id === newNotification.id);
          
          if (existingIndex >= 0) {
            // Update existing notification
            const updated = [...prev];
            updated[existingIndex] = newNotification;
            return updated;
          } else {
            // Add new notification at the beginning
            return [newNotification, ...prev.slice(0, 49)]; // Keep max 50
          }
        });
        
        // Recalculate unread count
        setNotifications(currentNotifications => {
          const unreadCount = currentNotifications.filter(n => !n.read).length;
          setUnreadCount(unreadCount);
          return currentNotifications;
        });
      }
    );

    return unsubscribe;
  }, []);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const result = await notificationService.markAsRead(notificationId);
      
      if (result.success) {
        // Update local state immediately
        setNotifications(prev => 
          prev.map(n => 
            n.id === notificationId ? { ...n, read: true } : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
        return true;
      } else {
        console.error('🚨 [ADMIN NOTIFICATIONS] Failed to mark as read:', result.error);
        return false;
      }
    } catch (error) {
      console.error('🚨 [ADMIN NOTIFICATIONS] Error marking as read:', error);
      return false;
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      
      // Mark each unread notification as read
      const results = await Promise.all(
        unreadNotifications.map(n => notificationService.markAsRead(n.id))
      );
      
      const successCount = results.filter(r => r.success).length;
      
      if (successCount > 0) {
        // Update local state immediately
        setNotifications(prev => 
          prev.map(n => ({ ...n, read: true }))
        );
        setUnreadCount(0);
      }
      
      return successCount;
    } catch (error) {
      console.error('🚨 [ADMIN NOTIFICATIONS] Error marking all as read:', error);
      return 0;
    }
  }, [notifications]);

  // Get notifications by category
  const businessNotifications = useMemo(() => 
    notifications.filter(n => n.category === 'business'), 
    [notifications]
  );
  
  const chatNotifications = useMemo(() => 
    notifications.filter(n => n.category === 'chat'), 
    [notifications]
  );

  // Get unread count by category
  const businessUnreadCount = useMemo(() => 
    notifications.filter(n => n.category === 'business' && !n.read).length, 
    [notifications]
  );
  
  const chatUnreadCount = useMemo(() => 
    notifications.filter(n => n.category === 'chat' && !n.read).length, 
    [notifications]
  );

  return {
    // State
    notifications,
    unreadCount,
    loading,
    error,
    
    // Actions
    markAsRead,
    markAllAsRead,
    refreshNotifications: loadNotifications,
    
    // Categories
    businessNotifications,
    businessUnreadCount,
    chatNotifications,
    chatUnreadCount,
  };
}
