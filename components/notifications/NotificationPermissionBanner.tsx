'use client';

import { useState, useEffect } from 'react';
import { Bell, BellOff, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useFCM } from '@/hooks/use-fcm';

interface NotificationPermissionBannerProps {
  userId?: string;
  userType?: 'customer' | 'provider' | 'admin';
  onDismiss?: () => void;
}

export function NotificationPermissionBanner({ 
  userId, 
  userType, 
  onDismiss 
}: NotificationPermissionBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  
  // Always call useFCM hook, but with conditional props
  const { isSupported, isRegistered, isLoading, error, register } = useFCM({
    userId: userId || undefined,
    userType: userType || undefined
  });

  // Check initial notification permission
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  // Check if banner was dismissed recently (within 24 hours)
  useEffect(() => {
    const dismissedTime = localStorage.getItem('notification-banner-dismissed');
    if (dismissedTime) {
      const dismissedDate = new Date(parseInt(dismissedTime));
      const now = new Date();
      const hoursDiff = (now.getTime() - dismissedDate.getTime()) / (1000 * 3600);
      
      if (hoursDiff < 24) {
        setIsDismissed(true);
      }
    }
  }, []);

  // Don't show if conditions not met
  if (!isSupported || isRegistered || isDismissed || notificationPermission === 'granted' || !userId || !userType) {
    return null;
  }

  const handleEnable = async () => {
    await register();
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('notification-banner-dismissed', Date.now().toString());
    onDismiss?.();
  };

  return (
    <Card className="border-orange-200 bg-orange-50 mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bell className="h-5 w-5 text-orange-600" />
            <CardTitle className="text-lg text-orange-800">
              Enable Push Notifications
            </CardTitle>
            <Badge variant="secondary" className="bg-orange-100 text-orange-700">
              Recommended
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="text-orange-600 hover:text-orange-700 hover:bg-orange-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-orange-700 mb-4">
          Stay updated with real-time notifications for booking updates, messages, and important alerts - 
          even when the website is closed!
        </CardDescription>
        
        <div className="flex items-center space-x-3">
          <Button 
            onClick={handleEnable}
            disabled={isLoading}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Setting up...
              </>
            ) : (
              <>
                <Bell className="h-4 w-4 mr-2" />
                Enable Notifications
              </>
            )}
          </Button>
          
          <Button 
            variant="outline"
            onClick={handleDismiss}
            className="border-orange-300 text-orange-700 hover:bg-orange-100"
          >
            Not Now
          </Button>
        </div>

        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center">
              <BellOff className="h-4 w-4 text-red-500 mr-2" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          </div>
        )}

        <div className="mt-3 text-xs text-orange-600">
          💡 Tip: You can manage notification preferences in your account settings
        </div>
      </CardContent>
    </Card>
  );
}

// Compact version for header/navbar
export function NotificationPermissionButton({ 
  userId, 
  userType 
}: Omit<NotificationPermissionBannerProps, 'onDismiss'>) {
  const { isSupported, isRegistered, isLoading, register } = useFCM({
    userId,
    userType
  });

  // Don't show if not supported or already registered
  if (!isSupported || isRegistered || !userId || !userType) {
    return null;
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={register}
      disabled={isLoading}
      className="border-orange-300 text-orange-600 hover:bg-orange-50"
    >
      {isLoading ? (
        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-orange-600" />
      ) : (
        <Bell className="h-3 w-3" />
      )}
      <span className="hidden sm:inline ml-1">
        {isLoading ? 'Setting up...' : 'Enable Alerts'}
      </span>
    </Button>
  );
}
