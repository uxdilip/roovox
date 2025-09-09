/**
 * Enterprise-grade FCM Multi-User Management System
 * Based on how leading apps like Notion, Slack handle FCM
 */

import { getToken, onMessage, MessagePayload, Messaging } from 'firebase/messaging';
import { getMessagingInstance } from './config';
import { FCM_VAPID_KEY } from './constants';

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
  private tokenRefreshInterval: NodeJS.Timeout | null = null;
  private lastTokenValidation: number = 0;
  private readonly TOKEN_VALIDATION_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours
  
  private constructor() {
    this.deviceId = this.generateDeviceId();
    this.setupTokenValidation();
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

      // Get messaging instance
      this.messagingInstance = await getMessagingInstance();
      if (!this.messagingInstance) {
        return { success: false, error: 'Firebase messaging not available' };
      }

      // Get device token (this will be shared across all users on this device)
      const token = await getToken(this.messagingInstance, {
        vapidKey: FCM_VAPID_KEY,
        serviceWorkerRegistration: registration
      });

      if (!token) {
        return { success: false, error: 'Failed to get FCM token' };
      }

      this.currentToken = token;

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
   * Initialize from stored data with database verification
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
   * Restore user registration from database (WhatsApp/Slack pattern)
   */
  async restoreUserFromDatabase(userId: string, userType: 'customer' | 'provider' | 'admin'): Promise<boolean> {
    try {
      console.log(`🔄 [Enterprise FCM] Restoring ${userType} ${userId} from database...`);
      
      // Check if user has valid subscription in database
      const syncResult = await this.verifyRegistrationWithDatabase(userId, userType);
      
      if (syncResult.databaseExists) {
        // User is registered in database - restore token and local state
        const currentToken = this.currentToken;
        
        if (currentToken) {
          // Add user back to local state
          const userSubscription: UserSubscription = {
            userId,
            userType,
            activeSessionId: this.deviceId,
            lastActive: new Date().toISOString()
          };
          
          this.activeUsers.set(userId, userSubscription);
          this.saveActiveUsers();
          
          console.log(`✅ [Enterprise FCM] Restored ${userType} ${userId} from database`);
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error(`❌ [Enterprise FCM] Failed to restore user from database:`, error);
      return false;
    }
  }

  /**
   * Verify user registration status with database
   */
  async verifyRegistrationWithDatabase(userId: string, userType: string): Promise<{
    exists: boolean;
    shouldReRegister: boolean;
    localExists: boolean;
    databaseExists: boolean;
  }> {
    try {
      console.log(`🔍 [Enterprise FCM] Verifying registration for ${userType} ${userId}`);
      
      // Check local storage first
      const localExists = this.activeUsers.has(userId);
      
      // Check database status
      const response = await fetch('/api/fcm/verify-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, userType })
      });
      
      if (!response.ok) {
        console.error(`❌ [Enterprise FCM] Database verification failed with status ${response.status}`);
        throw new Error(`Database verification failed: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      const databaseExists = result.exists;
      
      console.log(`📊 [Enterprise FCM] Registration status for ${userType} ${userId}:`, {
        localExists,
        databaseExists,
        shouldReRegister: result.shouldReRegister
      });
      
      // If local exists but database doesn't, clear local registration
      if (localExists && !databaseExists) {
        console.log(`🧹 [Enterprise FCM] Clearing stale local registration for ${userId}`);
        this.activeUsers.delete(userId);
        this.saveActiveUsers();
      }
      
      return {
        exists: databaseExists,
        shouldReRegister: result.shouldReRegister,
        localExists,
        databaseExists
      };
      
    } catch (error: any) {
      console.error('❌ [Enterprise FCM] Registration verification failed:', error);
      
      // On error, assume re-registration is needed
      return {
        exists: false,
        shouldReRegister: true,
        localExists: this.activeUsers.has(userId),
        databaseExists: false
      };
    }
  }

  /**
   * Clear local registration for a user
   */
  clearLocalRegistration(userId: string): void {
    console.log(`🧹 [Enterprise FCM] Clearing local registration for ${userId}`);
    this.activeUsers.delete(userId);
    this.saveActiveUsers();
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

  /**
   * Setup token validation - Production ready token management
   */
  private setupTokenValidation(): void {
    if (typeof window === 'undefined') return; // Skip on server
    
    // Setup periodic token validation
    this.tokenRefreshInterval = setInterval(() => {
      this.validateTokenFreshness();
    }, this.TOKEN_VALIDATION_INTERVAL);

    // Validate token on startup if needed
    this.validateTokenFreshness();
  }

  /**
   * Validate token freshness and refresh if needed
   */
  private async validateTokenFreshness(): Promise<void> {
    const now = Date.now();
    const lastValidation = localStorage.getItem('fcm_last_validation');
    
    if (lastValidation && (now - parseInt(lastValidation)) < this.TOKEN_VALIDATION_INTERVAL) {
      return; // Token was validated recently
    }

    try {
      console.log('🔄 [Enterprise FCM] Validating token freshness...');
      
      // Get a fresh token
      const messaging = await getMessagingInstance();
      if (!messaging) return;

      const newToken = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
      });

      if (newToken && newToken !== this.currentToken) {
        console.log('🔄 [Enterprise FCM] Token has changed, updating registrations...');
        await this.handleTokenRefresh(newToken);
      }

      localStorage.setItem('fcm_last_validation', now.toString());
      this.lastTokenValidation = now;
      
    } catch (error) {
      console.error('❌ [Enterprise FCM] Token validation failed:', error);
    }
  }

  /**
   * Handle token refresh - Update all user registrations
   */
  private async handleTokenRefresh(newToken: string): Promise<void> {
    const oldToken = this.currentToken;
    this.currentToken = newToken;

    // Re-register all active users with the new token
    for (const [userId, userInfo] of this.activeUsers) {
      try {
        console.log(`🔄 [Enterprise FCM] Refreshing registration for user ${userId}...`);
        await this.registerUser(userId, userInfo.userType, userInfo);
      } catch (error) {
        console.error(`❌ [Enterprise FCM] Failed to refresh registration for user ${userId}:`, error);
      }
    }

    // Clean up old token from server if possible
    if (oldToken) {
      this.cleanupOldToken(oldToken);
    }
  }

  /**
   * Cleanup old token from server
   */
  private async cleanupOldToken(oldToken: string): Promise<void> {
    try {
      console.log('🧹 [Enterprise FCM] Cleaning up old token:', oldToken.substring(0, 20) + '...');
      
      const response = await fetch('/api/fcm/cleanup-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oldToken,
          deviceId: this.deviceId,
          userId: Array.from(this.activeUsers.keys())[0] // Get first active user
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ [Enterprise FCM] Token cleanup successful:', result.deactivatedTokens, 'tokens deactivated');
      } else {
        console.warn('⚠️ [Enterprise FCM] Token cleanup failed:', response.status);
      }
      
    } catch (error) {
      console.warn('⚠️ [Enterprise FCM] Failed to cleanup old token:', error);
    }
  }

  /**
   * Cleanup method - call this when user logs out or component unmounts
   */
  public cleanup(): void {
    if (this.tokenRefreshInterval) {
      clearInterval(this.tokenRefreshInterval);
      this.tokenRefreshInterval = null;
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
    getEnterpriseFCM().sendTestNotification(targetUserId, targetUserType),
  verifyRegistrationWithDatabase: (userId: string, userType: string) =>
    getEnterpriseFCM().verifyRegistrationWithDatabase(userId, userType),
  restoreUserFromDatabase: (userId: string, userType: 'customer' | 'provider' | 'admin') =>
    getEnterpriseFCM().restoreUserFromDatabase(userId, userType),
  clearLocalRegistration: (userId: string) => getEnterpriseFCM().clearLocalRegistration(userId)
};
