import { databases, DATABASE_ID, COLLECTIONS } from '@/lib/appwrite';
import { ID, Query } from 'appwrite';

export interface FCMTokenData {
  userId: string;
  userType: 'customer' | 'provider' | 'admin';
  token: string;
  deviceInfo: {
    platform: string;
    browser: string;
    userAgent: string;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

class FCMTokenService {
  /**
   * Save FCM token to Appwrite database
   */
  async saveToken(tokenData: FCMTokenData): Promise<{ success: boolean; tokenId?: string; error?: string }> {
    try {
      // Check if token already exists
      const existingTokens = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.FCM_TOKENS,
        [
          Query.equal('token', tokenData.token),
          Query.equal('user_id', tokenData.userId)
        ]
      );

      if (existingTokens.documents.length > 0) {
        // Update existing token
        const existingToken = existingTokens.documents[0];
        const updatedToken = await databases.updateDocument(
          DATABASE_ID,
          COLLECTIONS.FCM_TOKENS,
          existingToken.$id,
          {
            is_active: true,
            updated_at: new Date().toISOString(),
            device_info: JSON.stringify(tokenData.deviceInfo)
          }
        );
        
        return { success: true, tokenId: updatedToken.$id };
      } else {
        // Create new token
        const newToken = await databases.createDocument(
          DATABASE_ID,
          COLLECTIONS.FCM_TOKENS,
          ID.unique(),
          {
            user_id: tokenData.userId,
            user_type: tokenData.userType,
            token: tokenData.token,
            device_info: JSON.stringify(tokenData.deviceInfo),
            is_active: true,
            created_at: tokenData.createdAt,
            updated_at: tokenData.updatedAt
          }
        );
        
        return { success: true, tokenId: newToken.$id };
      }
    } catch (error: any) {
      console.error('Error saving FCM token:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get active FCM tokens for a user
   */
  async getActiveTokens(userId: string, userType: string): Promise<FCMTokenData[]> {
    try {
      const result = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.FCM_TOKENS,
        [
          Query.equal('user_id', userId),
          Query.equal('user_type', userType),
          Query.equal('is_active', true),
          Query.orderDesc('updated_at')
        ]
      );

      return result.documents.map(doc => ({
        userId: doc.user_id,
        userType: doc.user_type,
        token: doc.token,
        deviceInfo: JSON.parse(doc.device_info || '{}'),
        isActive: doc.is_active,
        createdAt: doc.created_at,
        updatedAt: doc.updated_at
      }));
    } catch (error) {
      console.error('Error getting active tokens:', error);
      return [];
    }
  }

  /**
   * Deactivate FCM token (when invalid or user logs out)
   */
  async deactivateToken(token: string): Promise<{ success: boolean; error?: string }> {
    try {
      const existingTokens = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.FCM_TOKENS,
        [Query.equal('token', token)]
      );

      if (existingTokens.documents.length > 0) {
        const tokenDoc = existingTokens.documents[0];
        await databases.updateDocument(
          DATABASE_ID,
          COLLECTIONS.FCM_TOKENS,
          tokenDoc.$id,
          {
            is_active: false,
            updated_at: new Date().toISOString()
          }
        );
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error deactivating token:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all active tokens for multiple users (for broadcast notifications)
   */
  async getTokensForUsers(userIds: string[], userType: string): Promise<FCMTokenData[]> {
    try {
      const result = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.FCM_TOKENS,
        [
          Query.equal('user_id', userIds),
          Query.equal('user_type', userType),
          Query.equal('is_active', true)
        ]
      );

      return result.documents.map(doc => ({
        userId: doc.user_id,
        userType: doc.user_type,
        token: doc.token,
        deviceInfo: JSON.parse(doc.device_info || '{}'),
        isActive: doc.is_active,
        createdAt: doc.created_at,
        updatedAt: doc.updated_at
      }));
    } catch (error) {
      console.error('Error getting tokens for users:', error);
      return [];
    }
  }

  /**
   * Cleanup inactive tokens (older than 30 days)
   */
  async cleanupInactiveTokens(): Promise<{ success: boolean; deletedCount?: number; error?: string }> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const inactiveTokens = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.FCM_TOKENS,
        [
          Query.equal('is_active', false),
          Query.lessThan('updated_at', thirtyDaysAgo.toISOString())
        ]
      );

      let deletedCount = 0;
      for (const token of inactiveTokens.documents) {
        await databases.deleteDocument(DATABASE_ID, COLLECTIONS.FCM_TOKENS, token.$id);
        deletedCount++;
      }

      return { success: true, deletedCount };
    } catch (error: any) {
      console.error('Error cleaning up inactive tokens:', error);
      return { success: false, error: error.message };
    }
  }
}

export const fcmTokenService = new FCMTokenService();
export default fcmTokenService;
