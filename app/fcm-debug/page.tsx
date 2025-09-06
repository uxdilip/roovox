"use client";

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function FCMDebugPage() {
  const { user, activeRole } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const checkTokens = async () => {
    if (!user?.id || !activeRole) {
      setError('User not logged in');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`/api/fcm/debug-tokens?userId=${user.id}&userType=${activeRole}`);
      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Failed to check tokens');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const testNotification = async () => {
    if (!user?.id || !activeRole) {
      setError('User not logged in');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/fcm/send-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          userType: activeRole,
          title: 'Debug Test Notification',
          body: 'This is a test notification to check if FCM is working',
          data: {
            type: 'test',
            category: 'system',
            priority: 'medium'
          },
          action: {
            type: 'system',
            id: 'test'
          },
          priority: 'normal'
        }),
      });

      const data = await response.json();
      setResult({ 
        type: 'notification_test',
        ...data,
        timestamp: new Date().toISOString()
      });

      if (!response.ok) {
        setError(data.error || 'Failed to send test notification');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertDescription>
            Please log in to access the FCM debug page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-6">
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">FCM Debug Tool</h1>
          <p className="text-muted-foreground">
            Debug FCM token registration and push notifications for user: {user.id} ({activeRole})
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>User Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div><strong>User ID:</strong> {user.id}</div>
            <div><strong>Role:</strong> <Badge>{activeRole}</Badge></div>
            <div><strong>Name:</strong> {user.name}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Debug Actions</CardTitle>
            <CardDescription>
              Use these tools to debug FCM token registration and notification sending
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button 
                onClick={checkTokens} 
                disabled={loading}
                variant="outline"
              >
                {loading ? 'Checking...' : 'Check FCM Tokens'}
              </Button>
              
              <Button 
                onClick={testNotification} 
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send Test Notification'}
              </Button>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {result && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {result.type === 'notification_test' ? 'Notification Test Result' : 'Token Check Result'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-sm">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expected Console Logs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm">
              <strong>Token Registration:</strong>
              <code className="block bg-gray-100 p-2 rounded mt-1">
                🔔 Registering FCM token for {activeRole} {user.id}<br/>
                ✅ FCM token registered successfully: [tokenId]
              </code>
            </div>
            
            <div className="text-sm">
              <strong>Notification Sending:</strong>
              <code className="block bg-gray-100 p-2 rounded mt-1">
                🔔 Sending push notification to {activeRole} {user.id}<br/>
                📱 Found [X] active tokens for user<br/>
                ✅ Push notification sent successfully
              </code>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
