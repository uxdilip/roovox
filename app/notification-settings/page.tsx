"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useFCM } from '@/hooks/use-fcm';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  BellOff, 
  MessageCircle, 
  Calendar, 
  CreditCard, 
  AlertCircle,
  CheckCircle,
  Settings,
  Smartphone,
  Globe
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function NotificationSettingsPage() {
  const { user, activeRole } = useAuth();
  const router = useRouter();
  
  // FCM Hook with manual registration control
  const { 
    token, 
    permission, 
    requestPermission, 
    isSupported,
    error: fcmError,
    register,
    isLoading,
    isRegistered
  } = useFCM({
    userId: user?.id,
    userType: activeRole as 'customer' | 'provider',
    autoRegister: false // Don't auto-register, let user choose
  });

  // Local state for notification preferences
  const [preferences, setPreferences] = useState({
    pushNotifications: false,
    chatMessages: true,
    bookingUpdates: true,
    paymentAlerts: true,
    promotionalOffers: false,
    systemUpdates: true
  });

  // Check if user is authenticated
  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  // Update push notifications preference based on permission and token status
  useEffect(() => {
    console.log('🔔 [Settings] State update:', { permission, token, isLoading, isRegistered });
    
    if (permission === 'granted' && (token || isRegistered)) {
      setPreferences(prev => ({ ...prev, pushNotifications: true }));
    } else {
      setPreferences(prev => ({ ...prev, pushNotifications: false }));
    }
  }, [permission, token, isLoading, isRegistered]);

  // Handle push notification toggle
  const handlePushNotificationToggle = async (enabled: boolean) => {
    if (enabled) {
      if (permission !== 'granted') {
        // Request permission first
        const granted = await requestPermission();
        if (!granted) {
          // Permission denied
          setPreferences(prev => ({ ...prev, pushNotifications: false }));
          return;
        }
      }
      
      // Register for FCM if permission granted but no token
      if (permission === 'granted' && !token) {
        await register();
      }
    }
    
    setPreferences(prev => ({ ...prev, pushNotifications: enabled }));
  };

  // Handle other preference toggles
  const handlePreferenceToggle = (key: keyof typeof preferences, value: boolean) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  // Get notification status info
  const getNotificationStatus = () => {
    if (!isSupported) {
      return {
        status: 'unsupported',
        message: 'Push notifications are not supported in this browser',
        color: 'destructive'
      };
    }
    
    if (permission === 'granted') {
      if (token) {
        return {
          status: 'enabled',
          message: 'Push notifications are enabled and working',
          color: 'default'
        };
      } else if (isLoading) {
        return {
          status: 'loading',
          message: 'Setting up push notifications...',
          color: 'secondary'
        };
      } else {
        return {
          status: 'granted',
          message: 'Permission granted, registering for notifications...',
          color: 'secondary'
        };
      }
    }
    
    if (permission === 'denied') {
      return {
        status: 'blocked',
        message: 'Push notifications are blocked. Please enable them in your browser settings',
        color: 'destructive'
      };
    }
    
    return {
      status: 'disabled',
      message: 'Push notifications are disabled. Enable them to receive alerts when the app is closed',
      color: 'secondary'
    };
  };

  const notificationStatus = getNotificationStatus();

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-8">
        
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Notification Settings</h1>
          <p className="text-muted-foreground">
            Manage how you receive notifications for messages, bookings, and updates.
          </p>
        </div>

        {/* Current Status Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <CardTitle>Current Status</CardTitle>
              </div>
              <Badge variant={notificationStatus.color as any}>
                {activeRole === 'provider' ? 'Provider' : 'Customer'}
              </Badge>
            </div>
            <CardDescription>
              Your current notification setup and permissions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            
            {/* Browser Support Check */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Globe className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Browser Support</p>
                  <p className="text-sm text-muted-foreground">
                    {isSupported ? 'Your browser supports push notifications' : 'Push notifications not supported'}
                  </p>
                </div>
              </div>
              <Badge variant={isSupported ? 'default' : 'destructive'}>
                {isSupported ? 'Supported' : 'Not Supported'}
              </Badge>
            </div>

            {/* Push Notification Status */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Smartphone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Push Notifications</p>
                  <p className="text-sm text-muted-foreground">
                    {notificationStatus.message}
                  </p>
                </div>
              </div>
              <Badge variant={notificationStatus.color as any}>
                {notificationStatus.status === 'enabled' ? 'Enabled' : 
                 notificationStatus.status === 'blocked' ? 'Blocked' :
                 notificationStatus.status === 'unsupported' ? 'Unsupported' : 
                 notificationStatus.status === 'loading' ? 'Setting up...' :
                 notificationStatus.status === 'granted' ? 'Registering...' : 'Disabled'}
              </Badge>
            </div>

            {/* Token Status */}
            {token && (
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Device registered for push notifications</span>
                <Badge variant="outline" className="ml-2">Token: {token.substring(0, 20)}...</Badge>
              </div>
            )}

            {/* Debug Info */}
            {process.env.NODE_ENV === 'development' && (
              <div className="text-xs text-muted-foreground p-2 bg-gray-100 rounded">
                <div>Permission: {permission || 'unknown'}</div>
                <div>Token: {token ? 'Available' : 'None'}</div>
                <div>Loading: {isLoading ? 'Yes' : 'No'}</div>
                <div>User: {user?.id || 'None'}</div>
                <div>Role: {activeRole || 'None'}</div>
              </div>
            )}

            {/* Error Display */}
            {fcmError && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {fcmError}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Push Notification Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Bell className="h-5 w-5" />
              <CardTitle>Push Notification Settings</CardTitle>
            </div>
            <CardDescription>
              Control when you receive push notifications on your device
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Master Push Toggle */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <Label className="text-base font-medium">Enable Push Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications even when the app is closed or in another tab
                </p>
              </div>
              <Switch
                checked={preferences.pushNotifications}
                onCheckedChange={handlePushNotificationToggle}
                disabled={!isSupported}
              />
            </div>

            {/* Individual Notification Types */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
                Notification Types
              </h4>
              
              {/* Chat Messages */}
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <MessageCircle className="h-4 w-4 text-blue-500" />
                  <div>
                    <Label className="font-medium">Chat Messages</Label>
                    <p className="text-sm text-muted-foreground">
                      New messages from {activeRole === 'provider' ? 'customers' : 'providers'}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={preferences.chatMessages}
                  onCheckedChange={(value) => handlePreferenceToggle('chatMessages', value)}
                  disabled={!preferences.pushNotifications}
                />
              </div>

              {/* Booking Updates */}
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-4 w-4 text-green-500" />
                  <div>
                    <Label className="font-medium">Booking Updates</Label>
                    <p className="text-sm text-muted-foreground">
                      {activeRole === 'provider' 
                        ? 'New bookings and booking status changes'
                        : 'Booking confirmations and status updates'
                      }
                    </p>
                  </div>
                </div>
                <Switch
                  checked={preferences.bookingUpdates}
                  onCheckedChange={(value) => handlePreferenceToggle('bookingUpdates', value)}
                  disabled={!preferences.pushNotifications}
                />
              </div>

              {/* Payment Alerts */}
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <CreditCard className="h-4 w-4 text-purple-500" />
                  <div>
                    <Label className="font-medium">Payment Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Payment confirmations and transaction updates
                    </p>
                  </div>
                </div>
                <Switch
                  checked={preferences.paymentAlerts}
                  onCheckedChange={(value) => handlePreferenceToggle('paymentAlerts', value)}
                  disabled={!preferences.pushNotifications}
                />
              </div>

              {/* System Updates */}
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="h-4 w-4 text-orange-500" />
                  <div>
                    <Label className="font-medium">System Updates</Label>
                    <p className="text-sm text-muted-foreground">
                      Important system announcements and maintenance notices
                    </p>
                  </div>
                </div>
                <Switch
                  checked={preferences.systemUpdates}
                  onCheckedChange={(value) => handlePreferenceToggle('systemUpdates', value)}
                  disabled={!preferences.pushNotifications}
                />
              </div>

              {/* Promotional Offers - Only for customers */}
              {activeRole === 'customer' && (
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Bell className="h-4 w-4 text-pink-500" />
                    <div>
                      <Label className="font-medium">Promotional Offers</Label>
                      <p className="text-sm text-muted-foreground">
                        Special deals and discounts from providers
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={preferences.promotionalOffers}
                    onCheckedChange={(value) => handlePreferenceToggle('promotionalOffers', value)}
                    disabled={!preferences.pushNotifications}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Help and Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Need Help?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              
              {/* Browser Instructions */}
              <div className="space-y-2">
                <h4 className="font-medium">If notifications are blocked:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Click the lock icon in your browser's address bar</li>
                  <li>• Set notifications to "Allow"</li>
                  <li>• Refresh this page and try again</li>
                </ul>
              </div>

              {/* What notifications include */}
              <div className="space-y-2">
                <h4 className="font-medium">What you'll receive:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Real-time chat messages</li>
                  <li>• Booking status updates</li>
                  <li>• Payment confirmations</li>
                  <li>• Important system alerts</li>
                </ul>
              </div>
            </div>

            {/* Test Notification Button */}
            {preferences.pushNotifications && token && (
              <div className="pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/notifications/test', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          userId: user.id,
                          userType: activeRole,
                          title: 'Test Notification',
                          message: 'This is a test notification to verify your settings are working!'
                        })
                      });
                      
                      if (response.ok) {
                        // Show success message
                        alert('Test notification sent! Check your notifications.');
                      } else {
                        alert('Failed to send test notification. Please check your settings.');
                      }
                    } catch (error) {
                      alert('Error sending test notification.');
                    }
                  }}
                  className="w-full sm:w-auto"
                >
                  <Bell className="h-4 w-4 mr-2" />
                  Send Test Notification
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
