import { useEffect, useState, useCallback } from 'react';
import { registerFCMToken, setupForegroundMessageListener, isFCMSupported } from '@/lib/firebase/messaging';
import { MultiUserFCMManager } from '@/lib/firebase/multi-user-fcm';
import { MessagePayload } from 'firebase/messaging';
import { useToast } from '@/hooks/use-toast';

interface UseFCMProps {
  userId?: string;
  userType?: 'customer' | 'provider' | 'admin';
  onMessageReceived?: (payload: MessagePayload) => void;
  autoRegister?: boolean; // New option to control auto-registration
}

interface UseFCMReturn {
  isSupported: boolean;
  isRegistered: boolean;
  isLoading: boolean;
  error: string | null;
  register: () => Promise<void>;
  token: string | null;
  permission: NotificationPermission | null;
  requestPermission: () => Promise<boolean>;
}

export const useFCM = ({ 
  userId, 
  userType, 
  onMessageReceived,
  autoRegister = true // Default to true for backward compatibility
}: UseFCMProps): UseFCMReturn => {
  const [isSupported, setIsSupported] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [permission, setPermission] = useState<NotificationPermission | null>(null);
  const { toast } = useToast();

  // Check FCM support and permission on mount
  useEffect(() => {
    const checkSupport = async () => {
      const supported = await isFCMSupported();
      setIsSupported(supported);
      
      if (supported && typeof window !== 'undefined' && 'Notification' in window) {
        setPermission(Notification.permission);
      }
    };
    
    checkSupport();
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setError('Push notifications are not supported in this browser');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setPermission(permission);
      
      if (permission === 'granted') {
        console.log('✅ Notification permission granted');
        return true;
      } else {
        console.log('❌ Notification permission denied');
        setError('Notification permission was denied');
        return false;
      }
    } catch (err: any) {
      console.error('❌ Error requesting notification permission:', err);
      setError('Failed to request notification permission');
      return false;
    }
  }, [isSupported]);

  const register = useCallback(async () => {
    if (!userId || !userType || !isSupported || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      console.log(`🔔 [useFCM] Starting FCM registration for ${userType} ${userId}...`);
      
      const result = await registerFCMToken(userId, userType);
      
      if (result.success && result.token) {
        console.log(`✅ [useFCM] FCM token obtained for ${userType}:`, result.token.substring(0, 20) + '...');
        
        // Register with multi-user system
        const registered = await MultiUserFCMManager.registerToken(result.token, userId, userType);
        
        if (registered) {
          setToken(result.token);
          setIsRegistered(true);
          setPermission('granted');
          
          // Show all current registrations for debugging
          const allRegistrations = MultiUserFCMManager.getAllRegistrations();
          console.log(`📊 [useFCM] All registrations on this device:`, allRegistrations.map(r => `${r.userType} ${r.userId}`));
          
          toast({
            title: "✅ Notifications Enabled",
            description: `Push notifications enabled for ${userType}`,
            duration: 3000,
          });
        } else {
          throw new Error('Failed to register with multi-user system');
        }
      } else {
        throw new Error(result.error || 'Failed to get FCM token');
      }
    } catch (error: any) {
      console.error(`❌ [useFCM] Registration failed for ${userType}:`, error);
      setError(error.message || 'Registration failed');
      setIsRegistered(false);
      
      toast({
        title: "❌ Registration Failed",
        description: error.message || 'Failed to enable notifications',
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  }, [userId, userType, isSupported, isLoading, toast]);

  // Check if user already has a registered token on mount
  useEffect(() => {
    const checkExistingToken = async () => {
      if (!userId || !userType || !isSupported) return;

      try {
        console.log(`🔔 [useFCM] Checking for existing token for ${userType} ${userId}...`);
        
        // Check multi-user registration system
        const existingToken = MultiUserFCMManager.getTokenForUser(userId, userType);
        
        if (existingToken) {
          console.log(`✅ [useFCM] Found multi-user token for ${userType}:`, existingToken.substring(0, 20) + '...');
          setToken(existingToken);
          setIsRegistered(true);
          return;
        }

        // If no local registration, check database
        const response = await fetch(`/api/fcm/debug-tokens?userId=${userId}&userType=${userType}`);
        const data = await response.json();

        if (response.ok && data.tokenCount > 0) {
          // User has token in database, register it locally
          const existingToken = data.fullTokens[0].token;
          setToken(existingToken);
          setIsRegistered(true);
          
          // Add to multi-user system
          await MultiUserFCMManager.registerToken(existingToken, userId, userType);
          console.log(`✅ [useFCM] Synced existing token for ${userType}:`, existingToken.substring(0, 20) + '...');
        } else {
          console.log(`ℹ️ [useFCM] No existing token found for ${userType} ${userId}`);
          setIsRegistered(false);
        }
      } catch (error) {
        console.error('❌ [useFCM] Error checking existing token:', error);
      }
    };

    checkExistingToken();
  }, [userId, userType, isSupported]);

  // Setup foreground message listener
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const setupListener = async () => {
      if (isSupported) {
        unsubscribe = await setupForegroundMessageListener((payload) => {
          console.log('📱 Foreground message received in hook:', payload);
          console.log('📱 Current user context:', { userId, userType });
          console.log('📱 Message target:', { targetUserId: payload.data?.userId, targetUserType: payload.data?.userType });
          
          // Check if this message should be shown to current user/tab
          const shouldShow = MultiUserFCMManager.handleIncomingMessage(payload);
          
          if (!shouldShow) {
            console.log('🚫 Message not for current user, suppressing notification');
            return;
          }
          
          // Show toast notification for foreground messages
          toast({
            title: payload.notification?.title || 'New Notification',
            description: payload.notification?.body || 'You have a new notification',
            duration: 5000,
          });

          // Call custom handler if provided
          if (onMessageReceived) {
            onMessageReceived(payload);
          }
        });
      }
    };

    setupListener();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [isSupported, onMessageReceived, toast]);

  // Auto-register when user info is available (if enabled)
  useEffect(() => {
    // Only auto-register if autoRegister is true and we have all required data
    if (autoRegister && isSupported && userId && userType && !isRegistered && !isLoading && !error && permission === 'granted') {
      console.log('🔔 [useFCM] Auto-registering FCM...', { userId, userType, permission, isRegistered, isLoading });
      
      const timeoutId = setTimeout(() => {
        register();
      }, 1000); // Small delay to ensure component is fully mounted

      return () => clearTimeout(timeoutId);
    }
  }, [autoRegister, isSupported, userId, userType, isRegistered, isLoading, error, permission, register]);

  return {
    isSupported,
    isRegistered,
    isLoading,
    error,
    register,
    token,
    permission,
    requestPermission
  };
};
