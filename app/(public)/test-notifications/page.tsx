'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { initializeApp, getApps } from 'firebase/app';

// Firebase config
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

export default function NotificationTestPage() {
  const [fcmToken, setFcmToken] = useState<string>('');
  const [permissionStatus, setPermissionStatus] = useState<string>('default');
  const [serviceWorkerStatus, setServiceWorkerStatus] = useState<string>('checking...');
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Test notification form
  const [testNotification, setTestNotification] = useState({
    title: 'Test Notification',
    body: 'This is a test notification from Sniket',
    userType: 'customer',
    userId: 'test-user-123',
    type: 'booking',
    clickAction: '/',
    priority: 'normal',
    image: ''
  });

  useEffect(() => {
    checkNotificationSupport();
    checkServiceWorker();
    setupFirebaseMessaging();
  }, []);

  const checkNotificationSupport = () => {
    if ('Notification' in window) {
      setPermissionStatus(Notification.permission);
    } else {
      setPermissionStatus('not-supported');
    }
  };

  const checkServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
        if (registration) {
          setServiceWorkerStatus('registered');
        } else {
          setServiceWorkerStatus('not-registered');
        }
      } catch (error) {
        setServiceWorkerStatus('error');
        console.error('Service Worker check failed:', error);
      }
    } else {
      setServiceWorkerStatus('not-supported');
    }
  };

  const setupFirebaseMessaging = async () => {
    try {
      if (!getApps().length) {
        initializeApp(firebaseConfig);
      }

      if ('serviceWorker' in navigator && 'Notification' in window) {
        const messaging = getMessaging();
        
        // Listen for foreground messages
        onMessage(messaging, (payload) => {
          console.log('🔔 Foreground message received:', payload);
          addTestResult('foreground-message', 'success', `Received: ${payload.notification?.title}`);
          
          toast({
            title: payload.notification?.title || 'New Notification',
            description: payload.notification?.body || 'You have a new notification',
          });
        });

        // Get FCM token
        if (Notification.permission === 'granted') {
          const token = await getToken(messaging, {
            vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
          });
          setFcmToken(token);
        }
      }
    } catch (error) {
      console.error('Firebase setup failed:', error);
      addTestResult('firebase-setup', 'error', `Setup failed: ${error}`);
    }
  };

  const requestNotificationPermission = async () => {
    try {
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);
      
      if (permission === 'granted') {
        const messaging = getMessaging();
        const token = await getToken(messaging, {
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
        });
        setFcmToken(token);
        addTestResult('permission', 'success', 'Permission granted and token obtained');
      } else {
        addTestResult('permission', 'error', 'Permission denied');
      }
    } catch (error) {
      console.error('Permission request failed:', error);
      addTestResult('permission', 'error', `Permission request failed: ${error}`);
    }
  };

  const registerServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        setServiceWorkerStatus('registered');
        addTestResult('service-worker', 'success', 'Service worker registered successfully');
        
        // Wait for it to be ready
        await navigator.serviceWorker.ready;
        addTestResult('service-worker', 'success', 'Service worker is ready');
      } catch (error) {
        console.error('Service worker registration failed:', error);
        setServiceWorkerStatus('error');
        addTestResult('service-worker', 'error', `Registration failed: ${error}`);
      }
    }
  };

  const testFCMTokenRegistration = async () => {
    if (!fcmToken) {
      addTestResult('token-registration', 'error', 'No FCM token available');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/fcm/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: fcmToken,
          userId: testNotification.userId,
          userType: testNotification.userType,
          deviceInfo: {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            timestamp: new Date().toISOString()
          }
        }),
      });

      const data = await response.json();

      if (response.ok) {
        addTestResult('token-registration', 'success', 'FCM token registered successfully');
      } else {
        addTestResult('token-registration', 'error', `Registration failed: ${data.error}`);
      }
    } catch (error) {
      addTestResult('token-registration', 'error', `Network error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const sendTestNotification = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/fcm/test-send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...testNotification,
          targetToken: fcmToken
        }),
      });

      const data = await response.json();

      if (response.ok) {
        addTestResult('test-notification', 'success', 'Test notification sent successfully');
      } else {
        addTestResult('test-notification', 'error', `Send failed: ${data.error}`);
      }
    } catch (error) {
      addTestResult('test-notification', 'error', `Network error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testFullNotificationFlow = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/fcm/test-full', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testNotification),
      });

      const data = await response.json();

      if (response.ok) {
        addTestResult('full-flow', 'success', 
          `Full flow test: ${data.successCount} sent, ${data.failureCount} failed`);
      } else {
        addTestResult('full-flow', 'error', `Full flow failed: ${data.error} (${data.reason})`);
      }
    } catch (error) {
      addTestResult('full-flow', 'error', `Network error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testLocalNotification = () => {
    if (Notification.permission === 'granted') {
      new Notification(testNotification.title, {
        body: testNotification.body,
        icon: '/assets/logo.png',
        tag: 'test-local',
        requireInteraction: false,
      } as NotificationOptions);
      addTestResult('local-notification', 'success', 'Local notification displayed');
    } else {
      addTestResult('local-notification', 'error', 'Notification permission not granted');
    }
  };

  const addTestResult = (test: string, status: 'success' | 'error' | 'warning', message: string) => {
    const result = {
      id: Date.now(),
      test,
      status,
      message,
      timestamp: new Date().toLocaleTimeString()
    };
    setTestResults(prev => [result, ...prev]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'destructive' | 'secondary'> = {
      'granted': 'default',
      'denied': 'destructive',
      'default': 'secondary',
      'registered': 'default',
      'not-registered': 'destructive',
      'error': 'destructive',
      'not-supported': 'destructive'
    };
    
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">🔔 FCM Notification Test Center</h1>
        <p className="text-gray-600">Test and debug Firebase Cloud Messaging implementation</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Status Cards */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🔐 Permission Status
              {getStatusBadge(permissionStatus)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Current notification permission: <strong>{permissionStatus}</strong>
            </p>
            {permissionStatus !== 'granted' && (
              <Button onClick={requestNotificationPermission} className="w-full">
                Request Permission
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              ⚙️ Service Worker
              {getStatusBadge(serviceWorkerStatus)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Service worker status: <strong>{serviceWorkerStatus}</strong>
            </p>
            {serviceWorkerStatus !== 'registered' && (
              <Button onClick={registerServiceWorker} className="w-full">
                Register Service Worker
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* FCM Token Display */}
      {fcmToken && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>🔑 FCM Token</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={fcmToken}
              readOnly
              className="font-mono text-xs"
              rows={3}
            />
            <Button 
              onClick={() => navigator.clipboard.writeText(fcmToken)}
              variant="outline"
              size="sm"
              className="mt-2"
            >
              Copy Token
            </Button>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="quick-tests" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="quick-tests">Quick Tests</TabsTrigger>
          <TabsTrigger value="custom-test">Custom Test</TabsTrigger>
          <TabsTrigger value="results">Test Results</TabsTrigger>
        </TabsList>

        <TabsContent value="quick-tests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>🚀 Quick Tests</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={testFCMTokenRegistration}
                disabled={!fcmToken || isLoading}
                className="w-full"
              >
                {isLoading ? 'Testing...' : '1. Test FCM Token Registration'}
              </Button>
              
              <Button 
                onClick={testLocalNotification}
                disabled={permissionStatus !== 'granted'}
                variant="outline"
                className="w-full"
              >
                2. Test Local Notification
              </Button>
              
              <Button 
                onClick={sendTestNotification}
                disabled={!fcmToken || isLoading}
                variant="outline"
                className="w-full"
              >
                {isLoading ? 'Sending...' : '3. Send FCM Test Notification (Direct)'}
              </Button>

              <Button 
                onClick={testFullNotificationFlow}
                disabled={isLoading}
                variant="outline"
                className="w-full"
              >
                {isLoading ? 'Testing...' : '4. Test Full Notification Flow (via Service)'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="custom-test" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>🎯 Custom Notification Test</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={testNotification.title}
                    onChange={(e) => setTestNotification(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="userType">User Type</Label>
                  <Select
                    value={testNotification.userType}
                    onValueChange={(value) => setTestNotification(prev => ({ ...prev, userType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="customer">Customer</SelectItem>
                      <SelectItem value="provider">Provider</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="body">Message Body</Label>
                <Textarea
                  id="body"
                  value={testNotification.body}
                  onChange={(e) => setTestNotification(prev => ({ ...prev, body: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Notification Type</Label>
                  <Select
                    value={testNotification.type}
                    onValueChange={(value) => setTestNotification(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="booking">Booking</SelectItem>
                      <SelectItem value="message">Message</SelectItem>
                      <SelectItem value="payment">Payment</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={testNotification.priority}
                    onValueChange={(value) => setTestNotification(prev => ({ ...prev, priority: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button 
                onClick={sendTestNotification}
                disabled={!fcmToken || isLoading}
                className="w-full"
              >
                {isLoading ? 'Sending...' : 'Send Custom Notification'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>📊 Test Results</CardTitle>
              <Button onClick={clearResults} variant="outline" size="sm">
                Clear Results
              </Button>
            </CardHeader>
            <CardContent>
              {testResults.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No test results yet. Run some tests!</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {testResults.map((result) => (
                    <Alert key={result.id} className={
                      result.status === 'success' ? 'border-green-200 bg-green-50' :
                      result.status === 'error' ? 'border-red-200 bg-red-50' :
                      'border-yellow-200 bg-yellow-50'
                    }>
                      <AlertDescription className="flex items-center justify-between">
                        <div>
                          <strong>{result.test}:</strong> {result.message}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            result.status === 'success' ? 'default' :
                            result.status === 'error' ? 'destructive' : 'secondary'
                          }>
                            {result.status}
                          </Badge>
                          <span className="text-xs text-gray-500">{result.timestamp}</span>
                        </div>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Debug Information */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>🐛 Debug Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Browser:</strong> {typeof window !== 'undefined' ? navigator.userAgent.split(' ').slice(-1)[0] : 'Server'}
            </div>
            <div>
              <strong>Platform:</strong> {typeof window !== 'undefined' ? navigator.platform : 'Server'}
            </div>
            <div>
              <strong>Service Worker Support:</strong> {typeof window !== 'undefined' && 'serviceWorker' in navigator ? '✅' : '❌'}
            </div>
            <div>
              <strong>Notification Support:</strong> {typeof window !== 'undefined' && 'Notification' in window ? '✅' : '❌'}
            </div>
            <div>
              <strong>HTTPS:</strong> {typeof window !== 'undefined' ? (location.protocol === 'https:' ? '✅' : '❌') : 'Unknown'}
            </div>
            <div>
              <strong>Localhost:</strong> {typeof window !== 'undefined' ? (location.hostname === 'localhost' ? '✅' : '❌') : 'Unknown'}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
