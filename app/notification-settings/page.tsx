"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useEnterpriseFCM } from '@/hooks/use-enterprise-fcm';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
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
  Globe,
  X,
  ArrowLeft
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function NotificationSettingsPage() {
  const { user, activeRole } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  // FCM Hook with manual registration control
  const { 
    token, 
    permission, 
    requestPermission, 
    isSupported,
    error: fcmError,
    register,
    isLoading,
    isRegistered,
    verifyDatabaseSync,
    syncStatus
  } = useEnterpriseFCM({
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

  // Verify database sync when component loads (once only)
  useEffect(() => {
    let hasVerified = false;
    
    if (user?.id && activeRole && !hasVerified) {
      console.log('📋 [Settings] Verifying database sync on page load...');
      verifyDatabaseSync();
      hasVerified = true;
    }
  }, [user?.id, activeRole]); // Removed verifyDatabaseSync from deps to prevent loops

  // Update push notifications preference based on permission and token status
  useEffect(() => {
    console.log('🔔 [Settings] State update:', { permission, token, isLoading, isRegistered });
    
    // Only update if we have a clear state
    if (!isLoading) {
      if (permission === 'granted' && isRegistered && token) {
        setPreferences(prev => ({ ...prev, pushNotifications: true }));
      } else if (permission === 'denied' || syncStatus === 'out_of_sync') {
        setPreferences(prev => ({ ...prev, pushNotifications: false }));
      }
      // Don't change state if permission is null or checking
    }
  }, [permission, token, isLoading, isRegistered, syncStatus]);

  // Handle push notification toggle
  const handlePushNotificationToggle = async (enabled: boolean) => {
    if (enabled) {
      // If out of sync, always re-register
      if (syncStatus === 'out_of_sync') {
        console.log('📋 [Settings] Out of sync detected, forcing re-registration...');
      }
      
      if (permission !== 'granted') {
        // Request permission first
        const granted = await requestPermission();
        if (!granted) {
          // Permission denied
          setPreferences(prev => ({ ...prev, pushNotifications: false }));
          return;
        }
      }
      
      // Register for FCM (this will handle re-registration if needed)
      await register();
      
      // Verify sync after registration
      setTimeout(() => {
        verifyDatabaseSync();
      }, 2000);
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
        message: 'Push notifications are not supported in this browser. Please use Chrome, Firefox, or Edge on HTTPS.',
        color: 'destructive'
      };
    }

    if (syncStatus === 'out_of_sync') {
      return {
        status: 'out_of_sync',
        message: 'Your notification settings are out of sync. Please re-enable notifications.',
        color: 'destructive'
      };
    }

    if (syncStatus === 'checking') {
      return {
        status: 'checking',
        message: 'Checking notification settings...',
        color: 'secondary'
      };
    }
    
    if (permission === 'granted') {
      if (token && isRegistered) {
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
        message: 'Push notifications are blocked. Please enable them in your browser settings.',
        color: 'destructive'
      };
    }
    
    return {
      status: 'disabled',
      message: 'Push notifications are disabled. Enable them to receive alerts when the app is closed.',
      color: 'secondary'
    };
  };

  const notificationStatus = getNotificationStatus();

  // Handle navigation back
  const handleGoBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      // Fallback navigation based on user role
      if (activeRole === 'provider') {
        router.push('/provider');
      } else if (activeRole === 'customer') {
        router.push('/customer');
      } else {
        router.push('/');
      }
    }
  };

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b lg:hidden">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleGoBack}
              className="h-8 w-8 p-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold">Notifications</h1>
              <p className="text-sm text-muted-foreground">Manage your alerts</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleGoBack}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4 lg:py-8 max-w-4xl">
        <div className="space-y-6 lg:space-y-8">
          
          {/* Desktop Header */}
          <div className="hidden lg:block">
            <div className="flex items-center justify-between mb-6">
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleGoBack}
                    className="h-8 w-8 p-0"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Notification Settings</h1>
                </div>
                <p className="text-muted-foreground ml-11">
                  Manage how you receive notifications for messages, bookings, and updates.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={handleGoBack}
                className="flex items-center space-x-2"
              >
                <X className="h-4 w-4" />
                <span className="hidden sm:inline">Close</span>
              </Button>
            </div>
          </div>

        {/* Current Status Card */}
        <Card className="w-full">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
              <div className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <CardTitle className="text-lg">Current Status</CardTitle>
              </div>
              <Badge variant={notificationStatus.color as any} className="self-start sm:self-center">
                {activeRole === 'provider' ? 'Provider' : 'Customer'}
              </Badge>
            </div>
            <CardDescription className="text-sm">
              Your current notification setup and permissions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            
            {/* Browser Support Check */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-muted/50 rounded-lg space-y-2 sm:space-y-0">
              <div className="flex items-center space-x-3">
                <Globe className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium text-sm sm:text-base">Browser Support</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {isSupported ? 'Your browser supports push notifications' : 'Push notifications not supported'}
                  </p>
                </div>
              </div>
              <Badge variant={isSupported ? 'default' : 'destructive'} className="self-start sm:self-center">
                {isSupported ? 'Supported' : 'Not Supported'}
              </Badge>
            </div>

            {/* Push Notification Status */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-muted/50 rounded-lg space-y-2 sm:space-y-0">
              <div className="flex items-center space-x-3">
                <Smartphone className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium text-sm sm:text-base">Push Notifications</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {notificationStatus.message}
                  </p>
                </div>
              </div>
              <Badge variant={notificationStatus.color as any} className="self-start sm:self-center">
                {notificationStatus.status === 'enabled' ? 'Enabled' : 
                 notificationStatus.status === 'blocked' ? 'Blocked' :
                 notificationStatus.status === 'unsupported' ? 'Unsupported' : 
                 notificationStatus.status === 'loading' ? 'Setting up...' :
                 notificationStatus.status === 'granted' ? 'Registering...' : 
                 notificationStatus.status === 'out_of_sync' ? 'Out of Sync' :
                 notificationStatus.status === 'checking' ? 'Checking...' : 'Disabled'}
              </Badge>
            </div>

            {/* Token Status */}
            {token && (
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Device registered for push notifications</span>
              </div>
            )}

            {/* Sync Status Warning */}
            {syncStatus === 'out_of_sync' && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Your notification settings are out of sync with our servers. 
                  Please re-enable push notifications to continue receiving alerts.
                </AlertDescription>
              </Alert>
            )}

            {/* Manual Sync Button */}
            {(syncStatus !== 'synced') && (
              <div className="flex flex-col sm:flex-row gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={verifyDatabaseSync}
                  disabled={syncStatus === 'checking'}
                  className="w-full sm:w-auto"
                >
                  {syncStatus === 'checking' ? 'Checking...' : 'Verify Settings'}
                </Button>
              </div>
            )}

            {/* Error Display */}
            {fcmError && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {fcmError.includes('Cloud Firestore API') ? (
                    <div>
                      <p className="font-medium mb-2">Firebase Setup Required</p>
                      <p>Please enable the Cloud Firestore API in your Firebase project:</p>
                      <a 
                        href="https://console.developers.google.com/apis/api/firestore.googleapis.com/overview?project=sniket-d2766" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        Enable Firestore API →
                      </a>
                    </div>
                  ) : (
                    fcmError
                  )}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Push Notification Settings */}
        <Card className="w-full">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-2">
              <Bell className="h-5 w-5" />
              <CardTitle className="text-lg">Push Notification Settings</CardTitle>
            </div>
            <CardDescription className="text-sm">
              Control when you receive push notifications on your device
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Master Push Toggle */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border rounded-lg space-y-3 sm:space-y-0">
              <div className="space-y-1 flex-1">
                <Label className="text-sm sm:text-base font-medium">Enable Push Notifications</Label>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Receive notifications even when the app is closed or in another tab
                </p>
              </div>
              <Switch
                checked={preferences.pushNotifications}
                onCheckedChange={handlePushNotificationToggle}
                disabled={!isSupported}
                className="self-start sm:self-center"
              />
            </div>

            {/* Individual Notification Types */}
            <div className="space-y-4">
              <h4 className="font-medium text-xs sm:text-sm text-muted-foreground uppercase tracking-wider">
                Notification Types
              </h4>
              
              {/* Chat Messages */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 border rounded-lg space-y-3 sm:space-y-0">
                <div className="flex items-start sm:items-center space-x-3 flex-1">
                  <MessageCircle className="h-4 w-4 text-blue-500 mt-0.5 sm:mt-0 flex-shrink-0" />
                  <div className="min-w-0">
                    <Label className="font-medium text-sm sm:text-base">Chat Messages</Label>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      New messages from {activeRole === 'provider' ? 'customers' : 'providers'}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={preferences.chatMessages}
                  onCheckedChange={(value) => handlePreferenceToggle('chatMessages', value)}
                  disabled={!preferences.pushNotifications}
                  className="self-start sm:self-center"
                />
              </div>

              {/* Booking Updates */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 border rounded-lg space-y-3 sm:space-y-0">
                <div className="flex items-start sm:items-center space-x-3 flex-1">
                  <Calendar className="h-4 w-4 text-green-500 mt-0.5 sm:mt-0 flex-shrink-0" />
                  <div className="min-w-0">
                    <Label className="font-medium text-sm sm:text-base">Booking Updates</Label>
                    <p className="text-xs sm:text-sm text-muted-foreground">
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
                  className="self-start sm:self-center"
                />
              </div>

              {/* Payment Alerts */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 border rounded-lg space-y-3 sm:space-y-0">
                <div className="flex items-start sm:items-center space-x-3 flex-1">
                  <CreditCard className="h-4 w-4 text-purple-500 mt-0.5 sm:mt-0 flex-shrink-0" />
                  <div className="min-w-0">
                    <Label className="font-medium text-sm sm:text-base">Payment Alerts</Label>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Payment confirmations and transaction updates
                    </p>
                  </div>
                </div>
                <Switch
                  checked={preferences.paymentAlerts}
                  onCheckedChange={(value) => handlePreferenceToggle('paymentAlerts', value)}
                  disabled={!preferences.pushNotifications}
                  className="self-start sm:self-center"
                />
              </div>

              {/* System Updates */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 border rounded-lg space-y-3 sm:space-y-0">
                <div className="flex items-start sm:items-center space-x-3 flex-1">
                  <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5 sm:mt-0 flex-shrink-0" />
                  <div className="min-w-0">
                    <Label className="font-medium text-sm sm:text-base">System Updates</Label>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Important system announcements and maintenance notices
                    </p>
                  </div>
                </div>
                <Switch
                  checked={preferences.systemUpdates}
                  onCheckedChange={(value) => handlePreferenceToggle('systemUpdates', value)}
                  disabled={!preferences.pushNotifications}
                  className="self-start sm:self-center"
                />
              </div>

              {/* Promotional Offers - Only for customers */}
              {activeRole === 'customer' && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 border rounded-lg space-y-3 sm:space-y-0">
                  <div className="flex items-start sm:items-center space-x-3 flex-1">
                    <Bell className="h-4 w-4 text-pink-500 mt-0.5 sm:mt-0 flex-shrink-0" />
                    <div className="min-w-0">
                      <Label className="font-medium text-sm sm:text-base">Promotional Offers</Label>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Special deals and discounts from providers
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={preferences.promotionalOffers}
                    onCheckedChange={(value) => handlePreferenceToggle('promotionalOffers', value)}
                    disabled={!preferences.pushNotifications}
                    className="self-start sm:self-center"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Help and Information */}
        <Card className="w-full">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Need Help?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              
              {/* Browser Instructions */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm sm:text-base">If notifications are blocked:</h4>
                <ul className="text-xs sm:text-sm text-muted-foreground space-y-1">
                  <li>• Click the lock icon in your browser's address bar</li>
                  <li>• Set notifications to "Allow"</li>
                  <li>• Refresh this page and try again</li>
                </ul>
              </div>

              {/* What notifications include */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm sm:text-base">What you'll receive:</h4>
                <ul className="text-xs sm:text-sm text-muted-foreground space-y-1">
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
                      console.log('🧪 [Settings] Sending test notification...');
                      const response = await fetch('/api/notifications/test', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          userId: user.id,
                          userType: activeRole,
                          title: '🧪 Test Notification',
                          message: 'This is a test notification to verify your settings are working!'
                        })
                      });
                      
                      const result = await response.json();
                      
                      if (response.ok && result.success) {
                        console.log('✅ [Settings] Test notification sent:', result);
                        toast({
                          title: "✅ Test Sent",
                          description: "Test notification sent! Check your notifications.",
                          duration: 3000,
                        });
                      } else {
                        console.error('❌ [Settings] Test notification failed:', result);
                        toast({
                          title: "❌ Test Failed",
                          description: result.error || 'Failed to send test notification.',
                          duration: 5000,
                        });
                      }
                    } catch (error) {
                      console.error('❌ [Settings] Test notification error:', error);
                      toast({
                        title: "❌ Test Error",
                        description: 'Error sending test notification.',
                        duration: 5000,
                      });
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
    </div>
  );
}
