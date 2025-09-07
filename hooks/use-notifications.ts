// 🆕 Fresh Notification Hook - Built from Scratch
// This hook manages notifications without duplicates or self-notifications

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/contexts/ChatContext';
import { notificationService, Notification } from '@/lib/notifications';

export function useNotifications() {
  const { user, activeRole, roles } = useAuth();
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
    if (!user?.id) return;

    const loadNotifications = async () => {
      setLoading(true);
      setError(null);
      try {
        // 🔔 NEW: Load notifications across ALL roles the user has so toasts appear everywhere
        const userRoles: string[] = Array.isArray(roles) && roles.length > 0
          ? roles
          : (activeRole ? [activeRole] : ['customer']); // fallback to customer if no roles yet

        if (userRoles.length === 0) {
          setNotifications([]);
          setUnreadCount(0);
          setLoading(false);
          return;
        }

        const roleResults = await Promise.all(
          userRoles.map(r => notificationService.getUserNotifications(user.id, r, 50))
        );

        const collected: Record<string, any> = {};
        roleResults.forEach(res => {
          if (res.success && res.notifications) {
            res.notifications.forEach(n => { collected[n.id] = n; });
          }
        });

        const merged = Object.values(collected) as any[];
        // Sort by lastMessageAt (desc) then createdAt
        merged.sort((a, b) => {
          const aTime = new Date(a.lastMessageAt || a.createdAt).getTime();
            const bTime = new Date(b.lastMessageAt || b.createdAt).getTime();
            return bTime - aTime;
        });

        setNotifications(merged);
        const unread = merged.filter(n => !n.read).length;
        setUnreadCount(unread);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();
  }, [user?.id, activeRole, roles]);

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!user?.id || isSubscribedRef.current) return; // drop activeRole dependency so we subscribe once for all roles

    // Clean up any existing subscription
    if (subscriptionRef.current) {
      subscriptionRef.current();
      subscriptionRef.current = null;
      isSubscribedRef.current = false;
    }

    // Create new subscription
    const unsubscribe = notificationService.subscribeToUserNotifications(
      user.id,
      activeRole || 'customer', // pass something for legacy but we'll relax filtering below
      (newNotification) => {
        console.log('🔔 [HOOK DEBUG] Received real-time notification:', {
          id: newNotification.id,
          type: newNotification.type,
          category: newNotification.category,
          senderName: newNotification.senderName,
          skipToast: (newNotification as any).skipToast,
          read: newNotification.read,
          lastMessageAt: newNotification.lastMessageAt
        });
        // 🔔 NEW: Accept notification solely by user_id (ignore user_type so multi-role user always sees chat)
        if (newNotification.userId !== user.id) {
          return; // safety check
        }
        setNotifications(prev => {
          // 🆕 FIXED: Check if this is a truly new notification or an update
          const existingIndex = prev.findIndex(n => n.id === newNotification.id);
          
          if (existingIndex >= 0) {
            // Update existing notification (for Fiverr-style grouping or read status changes)
            const previousNotification = prev[existingIndex];
            const updated = [...prev];
            updated[existingIndex] = newNotification;
            
            console.log('🔔 [HOOK DEBUG] Updated existing notification:', newNotification.id, {
              previousLastMessage: previousNotification.lastMessageAt,
              newLastMessage: newNotification.lastMessageAt,
              isNewMessage: previousNotification.lastMessageAt !== newNotification.lastMessageAt,
              previousRead: previousNotification.read,
              newRead: newNotification.read,
              readStatusChanged: previousNotification.read !== newNotification.read
            });
            
            return updated;
          } else {
            // Add new notification at the beginning
            const updated = [newNotification, ...prev];
            console.log('🔔 [HOOK DEBUG] Added new notification:', newNotification.id, 'Read status:', newNotification.read);
            
            // Keep only latest 50 notifications
            return updated.slice(0, 50);
          }
        });
        
        // 🔔 FIXED: Always recalculate unread count from current notifications
        // This is more reliable than trying to track increments/decrements
        setNotifications(currentNotifications => {
          const unreadCount = currentNotifications.filter(n => !n.read).length;
          console.log('🔔 [HOOK DEBUG] Recalculated unread count:', unreadCount, 'from notifications:', currentNotifications.map(n => ({ id: n.id, read: n.read })));
          setUnreadCount(unreadCount);
          return currentNotifications;
        });
      }
    );

    subscriptionRef.current = unsubscribe;
    isSubscribedRef.current = true;

    console.log('🔔 [HOOK DEBUG] Subscription created for user:', user.id, 'with roles:', roles);

    // Cleanup function
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current();
        subscriptionRef.current = null;
      }
      isSubscribedRef.current = false;
    };
  }, [user?.id, roles]); // 🔔 FIXED: Add roles dependency to recreate subscription when roles change

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const result = await notificationService.markAsRead(notificationId);
      
      if (result.success) {
        // Update local state immediately for better UX
        setNotifications(prev => 
          prev.map(n => 
            n.id === notificationId ? { ...n, read: true } : n
          )
        );
        
        // Update unread count immediately (real-time will be ignored if it's a duplicate)
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

  // 🔔 NEW: Periodic sync to ensure unread count accuracy
  useEffect(() => {
    if (!user?.id || !activeRole) return;

    // Sync unread count every 30 seconds to handle any edge cases
    const syncInterval = setInterval(() => {
      const actualUnreadCount = notifications.filter(n => !n.read).length;
      setUnreadCount(actualUnreadCount);
    }, 30000); // 30 seconds

    return () => clearInterval(syncInterval);
  }, [notifications, user?.id, activeRole, roles]); // 🔔 FIXED: Add roles dependency

  // 🔔 FIXED: Mark notifications as read when user enters chat (but only when actively viewing)
  useEffect(() => {
    // 🔔 FIXED: Only auto-mark as read if user is actively viewing a specific conversation
    // AND the page has been visible for at least 2 seconds (to allow toasts to show)
    if (isInChatTab && activeConversationId && notifications.length > 0) {
      
      // Check if user is actively viewing this conversation (not just in chat tab)
      const isActivelyViewing = document.visibilityState === 'visible' && 
                                document.hasFocus && 
                                typeof document.hasFocus === 'function' ? 
                                document.hasFocus() : true;
      
      if (isActivelyViewing) {
        // 🔔 FIXED: Add a delay to allow toast notifications to be processed first
        const markAsReadTimer = setTimeout(() => {
          // Mark all notifications for this conversation as read
          const conversationNotifications = notifications.filter(
            n => n.relatedId === activeConversationId && !n.read
          );
          
          if (conversationNotifications.length > 0) {
            console.log('🔔 [HOOK DEBUG] Auto-marking notifications as read for active conversation:', activeConversationId, 'Count:', conversationNotifications.length);
            
            // Mark them as read in parallel
            Promise.all(
              conversationNotifications.map(n => markAsRead(n.id))
            ).then(() => {
              console.log('🔔 [HOOK DEBUG] Auto-marked notifications as read');
            });
          }
        }, 5000); // 🔔 FIXED: 5 second delay to allow toasts to show and user to see them

        return () => clearTimeout(markAsReadTimer);
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
        // Update local state immediately
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
    if (!user?.id) return; // 🔔 FIXED: Remove activeRole dependency
    
    setLoading(true);
    setError(null);
    
    try {
      // 🔔 FIXED: Use same multi-role logic as initial load
      const userRoles: string[] = Array.isArray(roles) && roles.length > 0
        ? roles
        : (activeRole ? [activeRole] : ['customer']);

      const roleResults = await Promise.all(
        userRoles.map(r => notificationService.getUserNotifications(user.id, r, 50))
      );

      const collected: Record<string, any> = {};
      roleResults.forEach(res => {
        if (res.success && res.notifications) {
          res.notifications.forEach(n => { collected[n.id] = n; });
        }
      });

      const merged = Object.values(collected) as any[];
      merged.sort((a, b) => {
        const aTime = new Date(a.lastMessageAt || a.createdAt).getTime();
        const bTime = new Date(b.lastMessageAt || b.createdAt).getTime();
        return bTime - aTime;
      });

      setNotifications(merged);
      const unread = merged.filter(n => !n.read).length;
      setUnreadCount(unread);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [user?.id, activeRole, roles]); // 🔔 FIXED: Add roles dependency

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
