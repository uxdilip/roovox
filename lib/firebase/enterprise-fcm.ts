/**
 * Enterprise-grade FCM Multi-User Management System
 * Based on how leading apps like Notion, Slack handle FCM
 */

import { getToken, onMessage, MessagePayload } from 'firebase/messaging';
import { getMessagingInstance } from './config';

interface DeviceToken {
  token: string;
  deviceId: string;
  browser: string;
  platform: string;
  userAgent: string;
  registeredAt: string;
}

interface UserSubscription {
  userId: string;
  userType: 'customer' | 'provider' | 'admin';
  email?: string;
  name?: string;
  activeSessionId: string;
  lastActive: string;
}

interface EnterpriseTokenRegistration {
  deviceToken: DeviceToken;
  userSubscriptions: UserSubscription[];
  topics: string[];
}

export class EnterpriseFCMManager {
  private static instance: EnterpriseFCMManager;
  private deviceId: string;
  private activeUsers: Map<string, UserSubscription> = new Map();
  private currentToken: string | null = null;
  private messagingInstance: any = null;
  
  private constructor() {
    this.deviceId = this.generateDeviceId();
  }

  static getInstance(): EnterpriseFCMManager {
    if (!EnterpriseFCMManager.instance) {
      EnterpriseFCMManager.instance = new EnterpriseFCMManager();
    }
    return EnterpriseFCMManager.instance;
  }

  private generateDeviceId(): string {
    // Check if we're in browser environment
    if (typeof window === 'undefined') {
      // SSR fallback - will be regenerated on client
      return `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    let deviceId = localStorage.getItem('enterprise_device_id');
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('enterprise_device_id', deviceId);
    }
    return deviceId;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getBrowserInfo(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  /**
   * Initialize FCM for multi-user support
   */
  async initializeMultiUserFCM(): Promise<{ success: boolean; token?: string; error?: string }> {
    try {
      console.log('🚀 [Enterprise FCM] Initializing multi-user FCM system...');

      // Check browser support
      if (!('Notification' in window) || !('serviceWorker' in navigator)) {
        return { success: false, error: 'Browser not supported' };
      }

      // Request permission if needed
      if (Notification.permission !== 'granted') {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          return { success: false, error: 'Permission denied' };
        }
      }

      // Register service worker with enterprise handling
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
        scope: '/',
        updateViaCache: 'none'
      });

      await navigator.serviceWorker.ready;
      console.log('✅ [Enterprise FCM] Service worker ready');

      // Get messaging instance
      this.messagingInstance = await getMessagingInstance();
      if (!this.messagingInstance) {
        return { success: false, error: 'Firebase messaging not available' };
      }

      // Get device token (this will be shared across all users on this device)
      const token = await getToken(this.messagingInstance, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
        serviceWorkerRegistration: registration
      });

      if (!token) {
        return { success: false, error: 'Failed to get FCM token' };
      }

      this.currentToken = token;
      console.log(`✅ [Enterprise FCM] Device token obtained: ${token.substring(0, 30)}...`);

      // Setup foreground message handling
      this.setupEnterpriseMessageListener();

      return { success: true, token };

    } catch (error: any) {
      console.error('❌ [Enterprise FCM] Initialization failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Register a user on this device
   */
  async registerUser(userId: string, userType: 'customer' | 'provider' | 'admin', userInfo?: { email?: string; name?: string }): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.currentToken) {
        const initResult = await this.initializeMultiUserFCM();
        if (!initResult.success) {
          return { success: false, error: initResult.error };
        }
      }

      const sessionId = this.generateSessionId();
      const userSubscription: UserSubscription = {
        userId,
        userType,
        email: userInfo?.email,
        name: userInfo?.name,
        activeSessionId: sessionId,
        lastActive: new Date().toISOString()
      };

      // Store locally
      this.activeUsers.set(userId, userSubscription);

      // Register with server using enterprise endpoint
      const response = await fetch('/api/fcm/enterprise/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceToken: {
            token: this.currentToken!,
            deviceId: this.deviceId,
            browser: this.getBrowserInfo(),
            platform: navigator.platform,
            userAgent: navigator.userAgent,
            registeredAt: new Date().toISOString()
          },
          userSubscription,
          // Subscribe to user-specific topics
          topics: [
            `user_${userId}`,
            `${userType}_notifications`,
            `${userType}_${userId}`,
            `device_${this.deviceId}`
          ]
        })
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Registration failed');
      }

      console.log(`✅ [Enterprise FCM] User registered: ${userType} ${userId}`);
      
      // Update localStorage for persistence
      this.saveActiveUsers();

      return { success: true };

    } catch (error: any) {
      console.error(`❌ [Enterprise FCM] User registration failed:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Setup enterprise message listener with smart routing
   */
  private setupEnterpriseMessageListener() {
    if (!this.messagingInstance) return;

    onMessage(this.messagingInstance, (payload: MessagePayload) => {
      console.log('📱 [Enterprise FCM] Foreground message received:', payload);
      
      // Extract target user from payload
      const targetUserId = payload.data?.userId || payload.data?.targetUserId;
      const targetUserType = payload.data?.userType || payload.data?.targetUserType;
      
      // Check if this message is for any active user on this device
      const shouldShow = this.shouldShowNotificationForCurrentDevice(targetUserId, targetUserType);
      
      if (shouldShow) {
        console.log('✅ [Enterprise FCM] Message is for active user, showing notification');
        this.showForegroundNotification(payload);
      } else {
        console.log('🚫 [Enterprise FCM] Message not for active users, suppressing');
      }
    });
  }

  /**
   * Check if notification should be shown on this device
   */
  private shouldShowNotificationForCurrentDevice(targetUserId?: string, targetUserType?: string): boolean {
    if (!targetUserId && !targetUserType) {
      // Broadcast message, show to all users
      return this.activeUsers.size > 0;
    }

    if (targetUserId) {
      // Specific user message
      return this.activeUsers.has(targetUserId);
    }

    if (targetUserType) {
      // User type message
      for (const user of this.activeUsers.values()) {
        if (user.userType === targetUserType) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Show foreground notification
   */
  private showForegroundNotification(payload: MessagePayload) {
    // Create custom event for the app to handle
    const notificationEvent = new CustomEvent('enterpriseFCMMessage', {
      detail: {
        payload,
        timestamp: Date.now(),
        deviceId: this.deviceId
      }
    });
    
    window.dispatchEvent(notificationEvent);
  }

  /**
   * Update user activity
   */
  updateUserActivity(userId: string) {
    const user = this.activeUsers.get(userId);
    if (user) {
      user.lastActive = new Date().toISOString();
      this.activeUsers.set(userId, user);
      this.saveActiveUsers();
    }
  }

  /**
   * Remove user from device
   */
  async unregisterUser(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const user = this.activeUsers.get(userId);
      if (!user) {
        return { success: true }; // Already not registered
      }

      // Unregister from server
      const response = await fetch('/api/fcm/enterprise/unregister', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: this.deviceId,
          userId,
          token: this.currentToken
        })
      });

      if (response.ok) {
        this.activeUsers.delete(userId);
        this.saveActiveUsers();
        console.log(`✅ [Enterprise FCM] User unregistered: ${userId}`);
      }

      return { success: true };

    } catch (error: any) {
      console.error('❌ [Enterprise FCM] Unregister failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get current active users
   */
  getActiveUsers(): UserSubscription[] {
    return Array.from(this.activeUsers.values());
  }

  /**
   * Save active users to localStorage
   */
  private saveActiveUsers() {
    if (typeof window === 'undefined') return;
    
    const usersData = Array.from(this.activeUsers.entries());
    localStorage.setItem('enterprise_active_users', JSON.stringify(usersData));
  }

  /**
   * Load active users from localStorage
   */
  private loadActiveUsers() {
    if (typeof window === 'undefined') return;
    
    try {
      const stored = localStorage.getItem('enterprise_active_users');
      if (stored) {
        const usersData = JSON.parse(stored);
        this.activeUsers = new Map(usersData);
      }
    } catch (error) {
      console.warn('Failed to load active users from localStorage');
    }
  }

  /**
   * Initialize from stored data
   */
  async initializeFromStorage(): Promise<boolean> {
    this.loadActiveUsers();
    
    if (this.activeUsers.size > 0) {
      const initResult = await this.initializeMultiUserFCM();
      return initResult.success;
    }
    
    return false;
  }

  /**
   * Send test notification through enterprise system
   */
  async sendTestNotification(targetUserId: string, targetUserType: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch('/api/fcm/enterprise/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId,
          targetUserType,
          title: 'Enterprise FCM Test',
          body: `Test notification for ${targetUserType} ${targetUserId}`,
          data: {
            type: 'test',
            timestamp: Date.now().toString(),
            source: 'enterprise-fcm-test'
          }
        })
      });

      const result = await response.json();
      return { success: response.ok, error: result.error };

    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance (lazy-loaded)
let enterpriseFCMInstance: EnterpriseFCMManager | null = null;

export const getEnterpriseFCM = (): EnterpriseFCMManager => {
  if (!enterpriseFCMInstance) {
    enterpriseFCMInstance = EnterpriseFCMManager.getInstance();
  }
  return enterpriseFCMInstance;
};

// Backward compatibility
export const enterpriseFCM = {
  get instance() {
    return getEnterpriseFCM();
  },
  initializeMultiUserFCM: () => getEnterpriseFCM().initializeMultiUserFCM(),
  registerUser: (userId: string, userType: 'customer' | 'provider' | 'admin', userInfo?: any) => 
    getEnterpriseFCM().registerUser(userId, userType, userInfo),
  unregisterUser: (userId: string) => getEnterpriseFCM().unregisterUser(userId),
  getActiveUsers: () => getEnterpriseFCM().getActiveUsers(),
  updateUserActivity: (userId: string) => getEnterpriseFCM().updateUserActivity(userId),
  initializeFromStorage: () => getEnterpriseFCM().initializeFromStorage(),
  sendTestNotification: (targetUserId: string, targetUserType: string) => 
    getEnterpriseFCM().sendTestNotification(targetUserId, targetUserType)
};
