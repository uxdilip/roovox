/**
 * Multi-User FCM Token Management
 * Handles multiple users/roles in the same browser properly
 */

export interface FCMTokenRegistration {
  token: string;
  userId: string;
  userType: 'customer' | 'provider' | 'admin';
  deviceInfo: {
    browser: string;
    platform: string;
    userAgent: string;
  };
  registeredAt: string;
}

export class MultiUserFCMManager {
  private static readonly STORAGE_KEY = 'fcm_multi_user_registrations';
  
  /**
   * Register FCM token for a specific user/role
   * In same browser, multiple users can share the same FCM token
   */
  static async registerToken(
    token: string,
    userId: string,
    userType: 'customer' | 'provider' | 'admin'
  ): Promise<boolean> {
    try {
      console.log(`🔄 [Multi-FCM] Registering token for ${userType} ${userId}`);
      
      // Get existing registrations from localStorage
      const registrations = this.getLocalRegistrations();
      
      // Create new registration
      const newRegistration: FCMTokenRegistration = {
        token,
        userId,
        userType,
        deviceInfo: {
          browser: this.getBrowserName(),
          platform: navigator.platform,
          userAgent: navigator.userAgent
        },
        registeredAt: new Date().toISOString()
      };
      
      // Check if this user/type already has a registration
      const existingIndex = registrations.findIndex(
        r => r.userId === userId && r.userType === userType
      );
      
      if (existingIndex !== -1) {
        // Update existing registration
        registrations[existingIndex] = newRegistration;
        console.log(`📝 [Multi-FCM] Updated existing registration for ${userType} ${userId}`);
      } else {
        // Add new registration
        registrations.push(newRegistration);
        console.log(`➕ [Multi-FCM] Added new registration for ${userType} ${userId}`);
      }
      
      // Save to localStorage
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(registrations));
      
      // Register with server
      const response = await fetch('/api/fcm/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          userType,
          token,
          multiUser: true, // Flag to indicate multi-user setup
          deviceInfo: newRegistration.deviceInfo
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log(`✅ [Multi-FCM] Server registration successful for ${userType} ${userId}`);
        return true;
      } else {
        console.error(`❌ [Multi-FCM] Server registration failed:`, result.error);
        return false;
      }
      
    } catch (error) {
      console.error(`❌ [Multi-FCM] Registration error:`, error);
      return false;
    }
  }
  
  /**
   * Get FCM token for specific user/type
   */
  static getTokenForUser(userId: string, userType: string): string | null {
    const registrations = this.getLocalRegistrations();
    const registration = registrations.find(
      r => r.userId === userId && r.userType === userType
    );
    return registration?.token || null;
  }
  
  /**
   * Get all users registered on this device
   */
  static getAllRegistrations(): FCMTokenRegistration[] {
    return this.getLocalRegistrations();
  }
  
  /**
   * Check if a user/type is registered
   */
  static isUserRegistered(userId: string, userType: string): boolean {
    return this.getTokenForUser(userId, userType) !== null;
  }
  
  /**
   * Unregister a specific user/type
   */
  static async unregisterUser(userId: string, userType: string): Promise<boolean> {
    try {
      const registrations = this.getLocalRegistrations();
      const filteredRegistrations = registrations.filter(
        r => !(r.userId === userId && r.userType === userType)
      );
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredRegistrations));
      
      // Also unregister from server
      const response = await fetch('/api/fcm/unregister', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, userType })
      });
      
      const result = await response.json();
      console.log(`🗑️ [Multi-FCM] Unregistered ${userType} ${userId}:`, result.success);
      
      return result.success;
    } catch (error) {
      console.error(`❌ [Multi-FCM] Unregister error:`, error);
      return false;
    }
  }
  
  /**
   * Clear all registrations (for testing/debugging)
   */
  static clearAllRegistrations(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    console.log(`🧹 [Multi-FCM] Cleared all local registrations`);
  }
  
  /**
   * Handle incoming FCM message and route to correct user
   */
  static handleIncomingMessage(payload: any): boolean {
    try {
      const targetUserId = payload.data?.userId;
      const targetUserType = payload.data?.userType;
      
      if (!targetUserId || !targetUserType) {
        console.log(`⚠️ [Multi-FCM] Message missing user info, showing to all tabs`);
        return true; // Show to all tabs
      }
      
      // Check if current tab matches the target user
      const registrations = this.getLocalRegistrations();
      const hasTargetUser = registrations.some(
        r => r.userId === targetUserId && r.userType === targetUserType
      );
      
      if (hasTargetUser) {
        console.log(`✅ [Multi-FCM] Message for ${targetUserType} ${targetUserId} - showing`);
        return true; // Show notification
      } else {
        console.log(`🚫 [Multi-FCM] Message not for this tab's users - suppressing`);
        return false; // Don't show notification
      }
      
    } catch (error) {
      console.error(`❌ [Multi-FCM] Message routing error:`, error);
      return true; // Default to showing
    }
  }
  
  // Helper methods
  private static getLocalRegistrations(): FCMTokenRegistration[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error(`❌ [Multi-FCM] Error reading registrations:`, error);
      return [];
    }
  }
  
  private static getBrowserName(): string {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  }
}
