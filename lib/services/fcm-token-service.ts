import { databases, DATABASE_ID, COLLECTIONS } from '@/lib/appwrite';
import { Query, ID } from 'appwrite';

export interface FCMTokenData {
  userId: string;
  userType: 'customer' | 'provider' | 'admin' | 'technician';
  token: string;
  deviceInfo: any;
  deviceId?: string; // Optional for backward compatibility
  platform?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FCMToken {
  $id: string;
  user_id: string;
  user_type: string;
  token: string;
  device_info: string;
  device_id?: string;
  platform?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export class FCMTokenService {
  /**
   * Save FCM token with device-based deduplication
   */
  static async saveToken(tokenData: FCMTokenData): Promise<FCMToken> {
    const now = new Date().toISOString();
    const tokenDataWithDates = {
      ...tokenData,
      createdAt: tokenData.createdAt || now,
      updatedAt: now
    };

    try {
      // First, check if the exact same token already exists and is active
      const existingSameToken = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.FCM_TOKENS,
        [
          Query.equal('user_id', tokenData.userId),
          Query.equal('user_type', tokenData.userType),
          Query.equal('token', tokenData.token),
          Query.equal('is_active', true)
        ]
      );

      // If the same token already exists and is active, just return it
      if (existingSameToken.documents.length > 0) {
        console.log('🔄 [FCM Service] Same token already exists and is active, returning existing token');
        return existingSameToken.documents[0] as unknown as FCMToken;
      }

      // Check if there's an existing active token for this device that's different
      let shouldDeactivateOld = false;
      if (tokenData.deviceId) {
        const existingDeviceTokens = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.FCM_TOKENS,
          [
            Query.equal('user_id', tokenData.userId),
            Query.equal('user_type', tokenData.userType),
            Query.equal('device_id', tokenData.deviceId),
            Query.equal('is_active', true)
          ]
        );
        
        // Only deactivate if there are existing tokens with different FCM tokens
        if (existingDeviceTokens.documents.length > 0) {
          const differentTokenExists = existingDeviceTokens.documents.some(
            (doc: any) => doc.token !== tokenData.token
          );
          shouldDeactivateOld = differentTokenExists;
        }
      } else {
        // Fallback: check for any different active tokens for this user
        const existingUserTokens = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.FCM_TOKENS,
          [
            Query.equal('user_id', tokenData.userId),
            Query.equal('user_type', tokenData.userType),
            Query.equal('is_active', true)
          ]
        );
        
        if (existingUserTokens.documents.length > 0) {
          const differentTokenExists = existingUserTokens.documents.some(
            (doc: any) => doc.token !== tokenData.token
          );
          shouldDeactivateOld = differentTokenExists;
        }
      }

      // Only deactivate old tokens if we found different ones
      if (shouldDeactivateOld) {
        if (tokenData.deviceId) {
          await this.deactivateDeviceTokens(tokenData.userId, tokenData.userType, tokenData.deviceId);
        } else {
          await this.deactivateUserTokens(tokenData.userId, tokenData.userType);
        }
      }

      // Create new active token only if it doesn't already exist
      const newToken = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.FCM_TOKENS,
        ID.unique(),
        {
          user_id: tokenDataWithDates.userId,
          user_type: tokenDataWithDates.userType,
          token: tokenDataWithDates.token,
          device_info: JSON.stringify(tokenDataWithDates.deviceInfo),
          device_id: tokenDataWithDates.deviceId || null,
          is_active: true,
          created_at: tokenDataWithDates.createdAt,
          updated_at: tokenDataWithDates.updatedAt
        }
      );

      return newToken as unknown as FCMToken;

    } catch (error) {
      console.error('❌ [FCM Service] Error saving token:', error);
      throw error;
    }
  }

  /**
   * Deactivate all existing tokens for a user
   */
  static async deactivateUserTokens(userId: string, userType: string): Promise<void> {
    try {
      const existingTokens = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.FCM_TOKENS,
        [
          Query.equal('user_id', userId),
          Query.equal('user_type', userType),
          Query.equal('is_active', true)
        ]
      );

      if (existingTokens.documents.length > 0) {
        for (const token of existingTokens.documents) {
          await databases.updateDocument(
            DATABASE_ID,
            COLLECTIONS.FCM_TOKENS,
            token.$id,
            {
              is_active: false,
              updated_at: new Date().toISOString()
            }
          );
        }
      }
    } catch (error) {
      console.error('❌ [FCM Service] Error deactivating user tokens:', error);
    }
  }

  /**
   * Deactivate existing tokens for a specific device (enhanced deduplication)
   */
  static async deactivateDeviceTokens(userId: string, userType: string, deviceId: string): Promise<void> {
    try {
      const existingTokens = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.FCM_TOKENS,
        [
          Query.equal('user_id', userId),
          Query.equal('user_type', userType),
          Query.equal('device_id', deviceId),
          Query.equal('is_active', true)
        ]
      );

      if (existingTokens.documents.length > 0) {
        for (const token of existingTokens.documents) {
          await databases.updateDocument(
            DATABASE_ID,
            COLLECTIONS.FCM_TOKENS,
            token.$id,
            {
              is_active: false,
              updated_at: new Date().toISOString()
            }
          );
        }
      }
    } catch (error) {
      console.error('❌ [FCM Service] Error deactivating device tokens:', error);
    }
  }

  /**
   * Update existing token instead of creating a new one
   */
  static async updateExistingToken(tokenId: string, tokenData: FCMTokenData): Promise<FCMToken> {
    try {
      const updatedToken = await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.FCM_TOKENS,
        tokenId,
        {
          token: tokenData.token,
          device_info: JSON.stringify(tokenData.deviceInfo),
          device_id: tokenData.deviceId || null,
          is_active: true,
          updated_at: new Date().toISOString()
        }
      );

      return updatedToken as unknown as FCMToken;
    } catch (error) {
      console.error('❌ [FCM Service] Error updating existing token:', error);
      throw error;
    }
  }

  /**
   * Get active tokens for a user
   */
  static async getActiveTokensForUser(userId: string, userType: string): Promise<FCMToken[]> {
    try {
      const result = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.FCM_TOKENS,
        [
          Query.equal('user_id', userId),
          Query.equal('user_type', userType),
          Query.equal('is_active', true)
        ]
      );

      return result.documents as unknown as FCMToken[];
    } catch (error) {
      console.error('❌ [FCM Service] Error getting active tokens:', error);
      return [];
    }
  }

  /**
   * Get all active tokens from Appwrite for push notifications
   */
  static async getAllActiveTokens(): Promise<FCMToken[]> {
    try {
      const result = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.FCM_TOKENS,
        [
          Query.equal('is_active', true),
          Query.limit(1000) // Adjust as needed
        ]
      );

      return result.documents as unknown as FCMToken[];
    } catch (error) {
      console.error('❌ [FCM Service] Error getting all active tokens:', error);
      return [];
    }
  }

  /**
   * Remove a specific token
   */
  static async removeToken(tokenId: string): Promise<void> {
    try {
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.FCM_TOKENS,
        tokenId,
        {
          is_active: false,
          updated_at: new Date().toISOString()
        }
      );
    } catch (error) {
      console.error('❌ [FCM Service] Error removing token:', error);
      throw error;
    }
  }

  /**
   * Update token's last used timestamp
   */
  static async updateTokenUsage(tokenId: string): Promise<void> {
    try {
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.FCM_TOKENS,
        tokenId,
        {
          updated_at: new Date().toISOString()
        }
      );
    } catch (error) {
      console.error('❌ [FCM Service] Error updating token usage:', error);
    }
  }

  /**
   * Debug: Get all tokens for diagnostics
   */
  static async getAllTokens(): Promise<FCMToken[]> {
    try {
      const result = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.FCM_TOKENS,
        [
          Query.limit(1000)
        ]
      );

      return result.documents as unknown as FCMToken[];
    } catch (error) {
      console.error('❌ [FCM Service] Error getting all tokens:', error);
      return [];
    }
  }

  /**
   * Debug: Get tokens by user
   */
  static async getTokensByUser(userId: string): Promise<FCMToken[]> {
    try {
      const result = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.FCM_TOKENS,
        [
          Query.equal('user_id', userId),
          Query.limit(100)
        ]
      );

      return result.documents as unknown as FCMToken[];
    } catch (error) {
      console.error('❌ [FCM Service] Error getting tokens by user:', error);
      return [];
    }
  }
}

// Export default for backward compatibility
export default FCMTokenService;