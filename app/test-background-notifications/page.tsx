"use client";

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

export default function BackgroundNotificationTestPage() {
  const { user, activeRole } = useAuth();
  const [step, setStep] = useState(1);
  const [testResult, setTestResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const sendTestNotification = async () => {
    if (!user?.id || !activeRole) return;

    setLoading(true);
    
    try {
      const response = await fetch('/api/fcm/send-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          userType: activeRole,
          title: '🧪 Background Test',
          body: `Background notification test for ${user.name}. If you see this, FCM is working!`,
          data: {
            type: 'test',
            category: 'system',
            priority: 'high'
          },
          action: {
            type: 'system',
            id: 'background-test'
          },
          priority: 'high'
        }),
      });

      const result = await response.json();
      setTestResult(result);
      
      if (result.success && result.successCount > 0) {
        setStep(3);
      } else {
        setStep(4);
      }
    } catch (error: any) {
      setTestResult({ error: error.message });
      setStep(4);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertDescription>Please log in to test background notifications.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-6">
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">🧪 Background Notification Test</h1>
          <p className="text-muted-foreground">
            Follow these steps to test if background notifications are working properly.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Current User</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div><strong>Name:</strong> {user.name}</div>
              <div><strong>ID:</strong> {user.id}</div>
              <div><strong>Role:</strong> <Badge>{activeRole}</Badge></div>
            </div>
          </CardContent>
        </Card>

        {/* Step 1: Instructions */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>📋 Step 1: Test Setup</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">Follow these steps exactly:</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>Make sure notification permission is granted (check browser address bar)</li>
                  <li>Keep this browser tab open</li>
                  <li>Click "Send Test Notification" below</li>
                  <li>You should see a desktop notification immediately</li>
                  <li>Then we'll test background notifications</li>
                </ol>
              </div>
              
              <Button onClick={() => setStep(2)} className="w-full">
                ✅ I'm Ready - Start Test
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Send Test Notification */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>🚀 Step 2: Send Test Notification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertDescription>
                  Click the button below. You should see a desktop notification immediately.
                </AlertDescription>
              </Alert>
              
              <Button 
                onClick={sendTestNotification} 
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading ? '🔄 Sending...' : '📱 Send Test Notification'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Success */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>✅ Step 3: Test Successful!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="border-green-200 bg-green-50">
                <AlertDescription className="text-green-800">
                  Great! The notification was sent successfully. Did you see the desktop notification?
                </AlertDescription>
              </Alert>

              <div className="bg-gray-100 p-4 rounded-lg">
                <pre className="text-sm">{JSON.stringify(testResult, null, 2)}</pre>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">📱 Next: Test Background Notifications</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>Open a second browser (different from this one)</li>
                  <li>Go to: <code>http://localhost:3001</code></li>
                  <li>Login as a different user type (customer/provider)</li>
                  <li>Start a chat conversation with this user</li>
                  <li><strong>Close this browser tab completely</strong></li>
                  <li>Send a message from the other browser</li>
                  <li>You should get a desktop notification even with this tab closed</li>
                </ol>
              </div>

              <Button onClick={() => setStep(1)} variant="outline">
                🔄 Test Again
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Error */}
        {step === 4 && (
          <Card>
            <CardHeader>
              <CardTitle>❌ Test Failed</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertDescription>
                  The notification test failed. Check the details below:
                </AlertDescription>
              </Alert>

              <div className="bg-gray-100 p-4 rounded-lg">
                <pre className="text-sm">{JSON.stringify(testResult, null, 2)}</pre>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">🔧 Troubleshooting:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Check if notification permission is granted</li>
                  <li>Go to notification settings and enable push notifications</li>
                  <li>Check browser console for error messages</li>
                  <li>Try refreshing the page and testing again</li>
                </ul>
              </div>

              <div className="flex gap-2">
                <Button onClick={() => setStep(1)}>🔄 Try Again</Button>
                <Button variant="outline" onClick={() => window.open('/notification-settings', '_blank')}>
                  ⚙️ Notification Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Current Browser Info */}
        <Card>
          <CardHeader>
            <CardTitle>🌐 Browser Information</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            <div><strong>User Agent:</strong> {navigator.userAgent}</div>
            <div><strong>Platform:</strong> {navigator.platform}</div>
            <div><strong>URL:</strong> {window.location.href}</div>
            <div><strong>Notification Permission:</strong> <Badge>{Notification.permission}</Badge></div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
