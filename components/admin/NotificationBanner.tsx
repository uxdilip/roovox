"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Bell, X, BellOff, Clock, CheckCircle } from 'lucide-react';
import { registerFCMToken } from '@/lib/firebase/messaging';
import { FCMTokenService } from '@/lib/services/fcm-token-service';

interface NotificationBannerProps {
  userId: string;
  userType: 'admin';
  onStatusChange?: (status: NotificationStatus) => void;
}

export type NotificationStatus = 'checking' | 'enabled' | 'disabled' | 'denied' | 'error';

export default function NotificationBanner({ userId, userType, onStatusChange }: NotificationBannerProps) {
  const [status, setStatus] = useState<NotificationStatus>('checking');
  const [isRegistering, setIsRegistering] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [remindLater, setRemindLater] = useState(false);

  // Check initial notification status
  useEffect(() => {
    checkNotificationStatus();
  }, [userId, userType]);

  // Notify parent component of status changes
  useEffect(() => {
    onStatusChange?.(status);
  }, [status, onStatusChange]);

  // Check if notifications are enabled
  const checkNotificationStatus = async () => {
    try {
      setStatus('checking');

      // Check browser notification permission
      const permission = typeof window !== 'undefined' && 'Notification' in window 
        ? Notification.permission 
        : 'denied';

      if (permission === 'denied') {
        setStatus('denied');
        return;
      }

      // Check if we have active FCM tokens in database
      const activeTokens = await FCMTokenService.getActiveTokensForUser(userId, userType);
      
      if (activeTokens.length > 0) {
        setStatus('enabled');
      } else {
        setStatus('disabled');
      }

    } catch (error) {
      console.error('Error checking notification status:', error);
      setStatus('error');
    }
  };

  // Enable notifications
  const handleEnableNotifications = async () => {
    try {
      setIsRegistering(true);

      const result = await registerFCMToken(userId, userType);

      if (result.success) {
        setStatus('enabled');
        setIsDismissed(false);
        setRemindLater(false);
        
        // Store success in localStorage
        localStorage.setItem('admin_notifications_enabled', 'true');
        localStorage.removeItem('admin_notifications_remind_later');
      } else {
        if (result.error?.includes('denied')) {
          setStatus('denied');
        } else {
          setStatus('error');
        }
      }

    } catch (error: any) {
      console.error('Error enabling notifications:', error);
      setStatus('error');
    } finally {
      setIsRegistering(false);
    }
  };

  // Dismiss banner for current session
  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('admin_notifications_dismissed', Date.now().toString());
  };

  // Remind later (24 hours)
  const handleRemindLater = () => {
    setRemindLater(true);
    setIsDismissed(true);
    const remindTime = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
    localStorage.setItem('admin_notifications_remind_later', remindTime.toString());
  };

  // Check if we should show the banner
  const shouldShowBanner = () => {
    // Don't show if manually dismissed in this session
    if (isDismissed) return false;

    // Don't show if already enabled
    if (status === 'enabled') return false;

    // Don't show while checking
    if (status === 'checking') return false;

    // Check remind later setting
    const remindLaterTime = localStorage.getItem('admin_notifications_remind_later');
    if (remindLaterTime && Date.now() < parseInt(remindLaterTime)) {
      return false;
    }

    // Check session dismissal (show again after page reload unless remind later is set)
    const sessionDismissed = localStorage.getItem('admin_notifications_dismissed');
    if (sessionDismissed && !remindLaterTime) {
      // Reset session dismissal after 1 hour
      const dismissedTime = parseInt(sessionDismissed);
      if (Date.now() - dismissedTime < (60 * 60 * 1000)) {
        return false;
      } else {
        localStorage.removeItem('admin_notifications_dismissed');
      }
    }

    return status === 'disabled' || status === 'denied' || status === 'error';
  };

  // Don't render if banner shouldn't be shown
  if (!shouldShowBanner()) {
    return null;
  }

  // Banner content based on status
  const getBannerContent = () => {
    switch (status) {
      case 'disabled':
        return {
          icon: <BellOff className="h-5 w-5 text-orange-600" />,
          title: 'Enable notifications for unresponded customer messages',
          description: 'Get instant alerts when customers need help and providers haven\'t responded within 10 minutes.',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          showEnableButton: true
        };

      case 'denied':
        return {
          icon: <BellOff className="h-5 w-5 text-red-600" />,
          title: 'Notification permission required',
          description: 'Please allow notifications in your browser settings to receive customer message alerts.',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          showEnableButton: true
        };

      case 'error':
        return {
          icon: <BellOff className="h-5 w-5 text-gray-600" />,
          title: 'Notification setup issue',
          description: 'There was a problem setting up notifications. Please try again or contact support.',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          showEnableButton: true
        };

      default:
        return null;
    }
  };

  const content = getBannerContent();
  if (!content) return null;

  return (
    <Card className={`mb-6 ${content.bgColor} ${content.borderColor} border-l-4`} data-notification-banner>
      <div className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            {content.icon}
            
            <div className="flex-1">
              <h3 className="font-medium text-gray-900 mb-1">
                {content.title}
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                {content.description}
              </p>

              <div className="flex flex-wrap gap-2">
                {content.showEnableButton && (
                  <Button
                    onClick={handleEnableNotifications}
                    disabled={isRegistering}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isRegistering ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Setting up...
                      </>
                    ) : (
                      <>
                        <Bell className="h-4 w-4 mr-2" />
                        Enable Notifications
                      </>
                    )}
                  </Button>
                )}
                
                <Button
                  onClick={handleRemindLater}
                  variant="outline"
                  size="sm"
                  disabled={isRegistering}
                >
                  Remind me later
                </Button>
              </div>
            </div>
          </div>

          <Button
            onClick={handleDismiss}
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-gray-600 p-1"
            disabled={isRegistering}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

// Export hook for status checking
export function useNotificationStatus(userId: string, userType: 'admin') {
  const [status, setStatus] = useState<NotificationStatus>('checking');

  useEffect(() => {
    const checkStatus = async () => {
      try {
        // Check browser permission
        const permission = typeof window !== 'undefined' && 'Notification' in window 
          ? Notification.permission 
          : 'denied';

        if (permission === 'denied') {
          setStatus('denied');
          return;
        }

        // Check database tokens
        const activeTokens = await FCMTokenService.getActiveTokensForUser(userId, userType);
        setStatus(activeTokens.length > 0 ? 'enabled' : 'disabled');

      } catch (error) {
        console.error('Error checking notification status:', error);
        setStatus('error');
      }
    };

    checkStatus();
  }, [userId, userType]);

  return { status, setStatus };
}
