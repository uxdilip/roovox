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
  verifyDatabaseSync: () => Promise<void>;
  syncStatus: 'unknown' | 'synced' | 'out_of_sync' | 'checking';
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
  const [syncStatus, setSyncStatus] = useState<'unknown' | 'synced' | 'out_of_sync' | 'checking'>('unknown');
  const { toast } = useToast();

  // Check support and permission on mount
  useEffect(() => {
    const checkSupport = async () => {
      // Enhanced browser support detection (WhatsApp/Slack pattern)
      const hasNotification = 'Notification' in window;
      const hasServiceWorker = 'serviceWorker' in navigator;
      const hasPromise = 'Promise' in window;
      const hasLocalStorage = 'localStorage' in window;
      const isSecureContext = window.isSecureContext || location.protocol === 'https:' || location.hostname === 'localhost';
      
      const basicSupport = hasNotification && hasServiceWorker && hasPromise && hasLocalStorage && isSecureContext;
      
      console.log('🔍 [FCM Hook] Browser support check:', {
        hasNotification,
        hasServiceWorker,
        hasPromise,
        hasLocalStorage,
        isSecureContext,
        basicSupport,
        userAgent: navigator.userAgent.substring(0, 50)
      });
      
      setIsSupported(basicSupport);
      
      if (basicSupport && hasNotification) {
        setPermission(Notification.permission);
        console.log('🔔 [FCM Hook] Current permission:', Notification.permission);
      } else {
        console.warn('❌ [FCM Hook] Browser not supported for FCM');
        setError('Your browser does not support push notifications. Please use Chrome, Firefox, or Edge.');
      }
    };
    
    checkSupport();
  }, []);

  // Initialize from stored data with database verification
  useEffect(() => {
    const initializeFromStorage = async () => {
      if (isSupported && userId && userType) {
        console.log(`🔄 [FCM Hook] Initializing for ${userType} ${userId}...`);
        
        // ALWAYS check database first (Industry pattern: WhatsApp/Slack)
        setSyncStatus('checking');
        
        try {
          const syncResult = await enterpriseFCM.verifyRegistrationWithDatabase(userId, userType);
          
          if (syncResult.databaseExists) {
            // Database has registration - restore state
            console.log(`✅ [FCM Hook] Found database registration for ${userId}`);
            setIsRegistered(true);
            setSyncStatus('synced');
            
            // Initialize local storage if needed
            if (!syncResult.localExists) {
              console.log(`🔄 [FCM Hook] Syncing local storage for ${userId}`);
              const restored = await enterpriseFCM.restoreUserFromDatabase(userId, userType);
              if (restored) {
                const users = enterpriseFCM.getActiveUsers();
                setActiveUsers(users);
              }
            } else {
              // Local data exists, just initialize
              await enterpriseFCM.initializeFromStorage();
              const users = enterpriseFCM.getActiveUsers();
              setActiveUsers(users);
            }
          } else {
            // No database registration found
            console.log(`❌ [FCM Hook] No database registration for ${userId}`);
            setIsRegistered(false);
            setSyncStatus('synced');
            
            // Clear any stale local data
            if (syncResult.localExists) {
              console.log(`🧹 [FCM Hook] Clearing stale local data for ${userId}`);
              await enterpriseFCM.unregisterUser(userId);
            }
          }
        } catch (error) {
          console.error('❌ [FCM Hook] Database check failed:', error);
          
          // Fallback: Check local storage only
          const initialized = await enterpriseFCM.initializeFromStorage();
          if (initialized) {
            const users = enterpriseFCM.getActiveUsers();
            setActiveUsers(users);
            const currentUser = users.find(u => u.userId === userId);
            setIsRegistered(!!currentUser);
          }
          setSyncStatus('unknown');
        }
      }
    };

    initializeFromStorage();
  }, [isSupported, userId, userType]);

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
      setSyncStatus('synced');

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

  // Database sync verification
  const verifyDatabaseSync = useCallback(async () => {
    if (!userId || !userType) return;

    setSyncStatus('checking');
    setError(null);

    try {
      console.log(`🔍 [FCM Hook] Verifying database sync for ${userType} ${userId}`);
      
      const syncResult = await enterpriseFCM.verifyRegistrationWithDatabase(userId, userType);
      
      if (syncResult.localExists && !syncResult.databaseExists) {
        // Out of sync - local says registered but database doesn't have record
        console.log(`⚠️ [FCM Hook] Out of sync detected for ${userId} - clearing local state`);
        setIsRegistered(false);
        setSyncStatus('out_of_sync');
        
        toast({
          title: "🔄 Sync Required",
          description: "Your notification settings need to be re-enabled",
          duration: 5000,
        });
      } else if (syncResult.databaseExists) {
        // In sync - database has record
        setIsRegistered(true);
        setSyncStatus('synced');
      } else {
        // Both local and database show not registered
        setIsRegistered(false);
        setSyncStatus('synced');
      }

    } catch (error: any) {
      console.error('❌ [FCM Hook] Database sync verification failed:', error);
      setSyncStatus('unknown');
      setError('Failed to verify notification status');
    }
  }, [userId, userType, toast]);

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
    sendTestNotification,
    verifyDatabaseSync,
    syncStatus
  };

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

  // Auto-register when user info is available (if enabled and sync is good)
  useEffect(() => {
    if (autoRegister && 
        isSupported && 
        userId && 
        userType && 
        !isRegistered && 
        !isLoading && 
        !error && 
        permission === 'granted' &&
        syncStatus !== 'out_of_sync') { // Don't auto-register if out of sync
      
      console.log('🏢 [Enterprise FCM] Auto-registering...', { 
        userId, 
        userType, 
        permission, 
        isRegistered, 
        isLoading,
        syncStatus
      });
      
      const timeoutId = setTimeout(() => {
        register();
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [autoRegister, isSupported, userId, userType, isRegistered, isLoading, error, permission, syncStatus, register]);

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
    sendTestNotification,
    verifyDatabaseSync,
    syncStatus
  };
};
