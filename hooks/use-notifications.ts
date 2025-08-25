// 🆕 Fresh Notification Hook - Built from Scratch
// This hook manages notifications without duplicates or self-notifications

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/contexts/ChatContext';
import { notificationService, Notification } from '@/lib/notifications';

export function useNotifications() {
  const { user, activeRole } = useAuth();
  const { activeConversationId, isInChatTab } = useChat();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Prevent duplicate subscriptions
  const subscriptionRef = useRef<(() => void) | null>(null);
  const isSubscribedRef = useRef(false);

  // Load initial notifications
  useEffect(() => {
    if (!user?.id || !activeRole) return;

    const loadNotifications = async () => {
      setLoading(true);
      setError(null);
      

      
      try {
        const result = await notificationService.getUserNotifications(user.id, activeRole, 50);
        
        if (result.success && result.notifications) {

          
          setNotifications(result.notifications);
          
          // Get unread count
          const countResult = await notificationService.getUnreadCount(user.id, activeRole);
          if (countResult.success) {

            setUnreadCount(countResult.count || 0);
          }
        } else {

          setError(result.error || 'Failed to load notifications');
        }
      } catch (err) {

        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();
  }, [user?.id, activeRole]);

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!user?.id || !activeRole || isSubscribedRef.current) return;


    
    // Clean up any existing subscription
    if (subscriptionRef.current) {
      subscriptionRef.current();
      subscriptionRef.current = null;
    }

    // Create new subscription
    const unsubscribe = notificationService.subscribeToUserNotifications(
      user.id,
      activeRole,
      (newNotification) => {

        
        setNotifications(prev => {
          // Prevent duplicate notifications
          const exists = prev.find(n => n.id === newNotification.id);
          if (exists) {

            return prev;
          }
          
          // Add new notification at the beginning
          const updated = [newNotification, ...prev];
          
          // Keep only latest 50 notifications
          return updated.slice(0, 50);
        });
        
        // Update unread count
        setUnreadCount(prev => {
          const newCount = prev + 1;

          return newCount;
        });
      }
    );

    subscriptionRef.current = unsubscribe;
    isSubscribedRef.current = true;

    // Cleanup function
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current();
        subscriptionRef.current = null;
      }
      isSubscribedRef.current = false;

    };
  }, [user?.id, activeRole]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const result = await notificationService.markAsRead(notificationId);
      
      if (result.success) {
        setNotifications(prev => 
          prev.map(n => 
            n.id === notificationId ? { ...n, read: true } : n
          )
        );
        
        // Update unread count
        setUnreadCount(prev => Math.max(0, prev - 1));
        
        return true;
      } else {
        console.error('🔔 [FRESH HOOK] Failed to mark notification as read:', result.error);
        return false;
      }
    } catch (error) {
      console.error('🔔 [FRESH HOOK] Error marking notification as read:', error);
      return false;
    }
  }, []);

  // 🔔 NEW: Mark notifications as read when user enters chat
  useEffect(() => {
    if (isInChatTab && activeConversationId && notifications.length > 0) {
      // Mark all notifications for this conversation as read
      const conversationNotifications = notifications.filter(
        n => n.relatedId === activeConversationId && !n.read
      );
      
      if (conversationNotifications.length > 0) {

        
        // Mark them as read in parallel
        Promise.all(
          conversationNotifications.map(n => markAsRead(n.id))
        ).then(() => {

        });
      }
    }
  }, [isInChatTab, activeConversationId, notifications, markAsRead]);

  // Duplicate function removed - using the one defined above

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
        setNotifications(prev => 
          prev.map(n => ({ ...n, read: true }))
        );
        setUnreadCount(0);

      }
      
      return successCount;
    } catch (error) {
      console.error('🔔 [FRESH HOOK] Error marking all notifications as read:', error);
      return 0;
    }
  }, [notifications]);

  // Refresh notifications
  const refreshNotifications = useCallback(async () => {
    if (!user?.id || !activeRole) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await notificationService.getUserNotifications(user.id, activeRole, 50);
      
      if (result.success && result.notifications) {
        setNotifications(result.notifications);
        
        // Get unread count
        const countResult = await notificationService.getUnreadCount(user.id, activeRole);
        if (countResult.success) {
          setUnreadCount(countResult.count || 0);
        }
      } else {
        setError(result.error || 'Failed to refresh notifications');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [user?.id, activeRole]);

  // Get notifications by category - memoized to prevent unnecessary re-renders
  const businessNotifications = useMemo(() => 
    notifications.filter(n => n.category === 'business'), 
    [notifications]
  );
  
  const chatNotifications = useMemo(() => 
    notifications.filter(n => n.category === 'chat'), 
    [notifications]
  );

  // Get unread count by category - memoized to prevent unnecessary re-renders
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
    refreshNotifications,
    
    // Utilities
    getNotificationsByCategory: (category: 'business' | 'chat') => 
      category === 'business' ? businessNotifications : chatNotifications,
    
    // Business notifications
    businessNotifications,
    businessUnreadCount,
    
    // Chat notifications
    chatNotifications,
    chatUnreadCount
  };
}
