import { useEffect, useState, useCallback } from 'react';
import { enterpriseFCM } from '@/lib/firebase/enterprise-fcm';
import { useToast } from '@/hooks/use-toast';

interface UseEnterpriseFCMProps {
  userId?: string;
  userType?: 'customer' | 'provider' | 'admin';
  userInfo?: {
    email?: string;
    name?: string;
  };
  onMessageReceived?: (payload: any) => void;
  autoRegister?: boolean;
}

interface UseEnterpriseFCMReturn {
  isSupported: boolean;
  isRegistered: boolean;
  isLoading: boolean;
  error: string | null;
  register: () => Promise<void>;
  unregister: () => Promise<void>;
  token: string | null;
  permission: NotificationPermission | null;
  requestPermission: () => Promise<boolean>;
  activeUsers: any[];
  sendTestNotification: () => Promise<void>;
}

export const useEnterpriseFCM = ({ 
  userId, 
  userType, 
  userInfo,
  onMessageReceived,
  autoRegister = true
}: UseEnterpriseFCMProps): UseEnterpriseFCMReturn => {
  const [isSupported, setIsSupported] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [permission, setPermission] = useState<NotificationPermission | null>(null);
  const [activeUsers, setActiveUsers] = useState<any[]>([]);
  const { toast } = useToast();

  // Check support and permission on mount
  useEffect(() => {
    const checkSupport = async () => {
      const supported = ('Notification' in window) && ('serviceWorker' in navigator);
      setIsSupported(supported);
      
      if (supported && typeof window !== 'undefined' && 'Notification' in window) {
        setPermission(Notification.permission);
      }
    };
    
    checkSupport();
  }, []);

  // Initialize from stored data on mount
  useEffect(() => {
    const initializeFromStorage = async () => {
      if (isSupported) {
        const initialized = await enterpriseFCM.initializeFromStorage();
        if (initialized) {
          const users = enterpriseFCM.getActiveUsers();
          setActiveUsers(users);
          
          // Check if current user is already registered
          const currentUser = users.find(u => u.userId === userId);
          if (currentUser) {
            setIsRegistered(true);
          }
        }
      }
    };

    initializeFromStorage();
  }, [isSupported, userId]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setError('Push notifications are not supported in this browser');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setPermission(permission);
      
      if (permission === 'granted') {
        console.log('✅ [Enterprise FCM] Notification permission granted');
        return true;
      } else {
        console.log('❌ [Enterprise FCM] Notification permission denied');
        setError('Notification permission was denied');
        return false;
      }
    } catch (err: any) {
      console.error('❌ [Enterprise FCM] Error requesting notification permission:', err);
      setError('Failed to request notification permission');
      return false;
    }
  }, [isSupported]);

  const register = useCallback(async () => {
    if (!userId || !userType || !isSupported || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      console.log(`🏢 [Enterprise FCM] Starting registration for ${userType} ${userId}...`);
      
      // Initialize enterprise FCM if not already done
      const initResult = await enterpriseFCM.initializeMultiUserFCM();
      if (!initResult.success) {
        throw new Error(initResult.error || 'Failed to initialize enterprise FCM');
      }

      setToken(initResult.token || null);

      // Register user
      const registerResult = await enterpriseFCM.registerUser(userId, userType, userInfo);
      if (!registerResult.success) {
        throw new Error(registerResult.error || 'Failed to register user');
      }

      setIsRegistered(true);
      setPermission('granted');

      // Update active users list
      const users = enterpriseFCM.getActiveUsers();
      setActiveUsers(users);

      console.log(`✅ [Enterprise FCM] User registered successfully: ${userType} ${userId}`);
      
      toast({
        title: "✅ Enterprise Notifications Enabled",
        description: `Push notifications enabled for ${userType}`,
        duration: 3000,
      });

    } catch (error: any) {
      console.error(`❌ [Enterprise FCM] Registration failed for ${userType}:`, error);
      setError(error.message || 'Registration failed');
      setIsRegistered(false);
      
      toast({
        title: "❌ Registration Failed",
        description: error.message || 'Failed to enable enterprise notifications',
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  }, [userId, userType, userInfo, isSupported, isLoading, toast]);

  const unregister = useCallback(async () => {
    if (!userId) return;

    try {
      const result = await enterpriseFCM.unregisterUser(userId);
      if (result.success) {
        setIsRegistered(false);
        
        // Update active users list
        const users = enterpriseFCM.getActiveUsers();
        setActiveUsers(users);
        
        toast({
          title: "✅ Unregistered",
          description: "Push notifications disabled",
          duration: 3000,
        });
      }
    } catch (error: any) {
      setError(error.message || 'Unregistration failed');
      toast({
        title: "❌ Unregistration Failed", 
        description: error.message || 'Failed to disable notifications',
        duration: 5000,
      });
    }
  }, [userId, toast]);

  const sendTestNotification = useCallback(async () => {
    if (!userId || !userType) return;

    try {
      const result = await enterpriseFCM.sendTestNotification(userId, userType);
      if (result.success) {
        toast({
          title: "✅ Test Sent",
          description: "Test notification sent successfully",
          duration: 3000,
        });
      } else {
        throw new Error(result.error || 'Failed to send test notification');
      }
    } catch (error: any) {
      toast({
        title: "❌ Test Failed",
        description: error.message || 'Failed to send test notification',
        duration: 5000,
      });
    }
  }, [userId, userType, toast]);

  // Setup enterprise message listener
  useEffect(() => {
    const handleEnterpriseMessage = (event: CustomEvent) => {
      const { payload } = event.detail;
      
      console.log('🏢 [Enterprise FCM] Foreground message received:', payload);
      
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
    };

    if (isSupported) {
      window.addEventListener('enterpriseFCMMessage', handleEnterpriseMessage as EventListener);
    }

    return () => {
      if (isSupported) {
        window.removeEventListener('enterpriseFCMMessage', handleEnterpriseMessage as EventListener);
      }
    };
  }, [isSupported, onMessageReceived, toast]);

  // Auto-register when user info is available (if enabled)
  useEffect(() => {
    if (autoRegister && 
        isSupported && 
        userId && 
        userType && 
        !isRegistered && 
        !isLoading && 
        !error && 
        permission === 'granted') {
      
      console.log('🏢 [Enterprise FCM] Auto-registering...', { 
        userId, 
        userType, 
        permission, 
        isRegistered, 
        isLoading 
      });
      
      const timeoutId = setTimeout(() => {
        register();
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [autoRegister, isSupported, userId, userType, isRegistered, isLoading, error, permission, register]);

  // Update user activity when hook is used
  useEffect(() => {
    if (userId && isRegistered) {
      enterpriseFCM.updateUserActivity(userId);
    }
  }, [userId, isRegistered]);

  return {
    isSupported,
    isRegistered,
    isLoading,
    error,
    register,
    unregister,
    token,
    permission,
    requestPermission,
    activeUsers,
    sendTestNotification
  };
};
