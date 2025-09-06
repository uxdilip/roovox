import { useEffect, useState, useCallback } from 'react';
import { registerFCMToken, setupForegroundMessageListener, isFCMSupported } from '@/lib/firebase/messaging';
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
    if (!userId || !userType) {
      setError('User ID and type are required for FCM registration');
      return;
    }

    if (!isSupported) {
      setError('Push notifications are not supported in this browser');
      return;
    }

    // Request permission if not already granted
    if (permission !== 'granted') {
      const granted = await requestPermission();
      if (!granted) {
        return;
      }
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log(`🔔 Registering FCM for ${userType} ${userId}`);
      
      const result = await registerFCMToken(userId, userType);

      if (result.success && result.token) {
        setToken(result.token);
        setIsRegistered(true);
        
        // Cache the token for faster access
        if (userId && userType) {
          const localStorageKey = `fcm_token_${userId}_${userType}`;
          localStorage.setItem(localStorageKey, result.token);
        }
        
        console.log('✅ FCM registration successful');
        
        // Show success toast
        toast({
          title: '🔔 Notifications Enabled',
          description: 'You will now receive push notifications for important updates',
          duration: 3000,
        });
      } else {
        throw new Error(result.error || 'Failed to register for notifications');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to register for notifications';
      setError(errorMessage);
      console.error('❌ FCM registration failed:', errorMessage);
      
      // Show error toast
      toast({
        title: '❌ Notification Setup Failed',
        description: errorMessage,
        variant: 'destructive',
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  }, [userId, userType, isSupported, permission, requestPermission, toast]);

  // Check if user already has a registered token on mount
  useEffect(() => {
    const checkExistingToken = async () => {
      if (!userId || !userType || !isSupported) return;

      try {
        console.log('🔔 [useFCM] Checking for existing token...');
        
        // First check localStorage for quick access
        const localStorageKey = `fcm_token_${userId}_${userType}`;
        const cachedToken = localStorage.getItem(localStorageKey);
        
        if (cachedToken && cachedToken !== 'null') {
          console.log('✅ [useFCM] Found cached token:', cachedToken.substring(0, 20) + '...');
          setToken(cachedToken);
          setIsRegistered(true);
          return;
        }

        // If no cached token, check database
        const response = await fetch(`/api/fcm/debug-tokens?userId=${userId}&userType=${userType}`);
        const data = await response.json();

        if (response.ok && data.activeTokens && data.activeTokens.length > 0) {
          // User already has an active token
          const existingToken = data.activeTokens[0].token;
          setToken(existingToken);
          setIsRegistered(true);
          
          // Cache the token for faster access
          localStorage.setItem(localStorageKey, existingToken);
          console.log('✅ [useFCM] Found existing token:', existingToken.substring(0, 20) + '...');
        } else {
          console.log('ℹ️ [useFCM] No existing token found');
          // Clear any stale cached token
          localStorage.removeItem(localStorageKey);
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
