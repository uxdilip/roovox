"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function NotificationFlowDebugPage() {
  const { user, activeRole } = useAuth();
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [isListening, setIsListening] = useState(false);

  const addDebugLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 49)]);
  };

  useEffect(() => {
    if (!user?.id || !activeRole) return;

    // Listen to console logs related to notifications
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;

    const logInterceptor = (...args: any[]) => {
      const message = args.join(' ');
      if (message.includes('🔔') || message.includes('TOAST') || message.includes('NOTIFICATION')) {
        addDebugLog(`LOG: ${message}`);
      }
      originalConsoleLog.apply(console, args);
    };

    const errorInterceptor = (...args: any[]) => {
      const message = args.join(' ');
      if (message.includes('🔔') || message.includes('TOAST') || message.includes('NOTIFICATION')) {
        addDebugLog(`ERROR: ${message}`);
      }
      originalConsoleError.apply(console, args);
    };

    if (isListening) {
      console.log = logInterceptor;
      console.error = errorInterceptor;

      addDebugLog(`Started monitoring notifications for ${activeRole} ${user.id}`);

      return () => {
        console.log = originalConsoleLog;
        console.error = originalConsoleError;
        addDebugLog('Stopped monitoring notifications');
      };
    }
  }, [isListening, user?.id, activeRole]);

  const testUserLookup = async () => {
    if (!user?.id || !activeRole) return;

    addDebugLog('Testing user lookup...');

    try {
      // Test user lookup for current user
      const response = await fetch('/api/test-user-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          userType: activeRole
        })
      });

      const result = await response.json();
      addDebugLog(`User lookup result: ${JSON.stringify(result, null, 2)}`);
    } catch (error: any) {
      addDebugLog(`User lookup error: ${error.message}`);
    }
  };

  const testNotificationCreation = async () => {
    if (!user?.id || !activeRole) return;

    addDebugLog('Testing notification creation...');

    try {
      const response = await fetch('/api/test-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          userType: activeRole,
          title: 'Debug Test',
          message: 'Testing notification flow'
        })
      });

      const result = await response.json();
      addDebugLog(`Notification creation result: ${JSON.stringify(result, null, 2)}`);
    } catch (error: any) {
      addDebugLog(`Notification creation error: ${error.message}`);
    }
  };

  const clearLogs = () => {
    setDebugLogs([]);
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertDescription>Please log in to debug notification flow.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-6">
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">🔍 Notification Flow Debug</h1>
          <p className="text-muted-foreground">
            Debug notification flow for user: {user.id} ({activeRole})
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Debug Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4 flex-wrap">
              <Button 
                onClick={() => setIsListening(!isListening)}
                variant={isListening ? 'destructive' : 'default'}
              >
                {isListening ? '⏹️ Stop Monitoring' : '▶️ Start Monitoring'}
              </Button>
              
              <Button onClick={testUserLookup} variant="outline">
                🔍 Test User Lookup
              </Button>
              
              <Button onClick={testNotificationCreation} variant="outline">
                🔔 Test Notification
              </Button>
              
              <Button onClick={clearLogs} variant="outline">
                🗑️ Clear Logs
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <strong>Status:</strong>
              <Badge variant={isListening ? 'default' : 'secondary'}>
                {isListening ? 'Monitoring Active' : 'Monitoring Inactive'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Real-time Debug Logs ({debugLogs.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
              {debugLogs.length === 0 ? (
                <div className="text-gray-500">No logs yet. Start monitoring and send a message to see the flow.</div>
              ) : (
                debugLogs.map((log, index) => (
                  <div key={index} className="mb-1">
                    {log}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>📋 Testing Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">To debug notification flow:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Click "Start Monitoring" above</li>
                <li>Open a second browser and login as opposite user type</li>
                <li>Send a message from the other browser</li>
                <li>Watch the logs above to see the complete notification flow</li>
                <li>Check if toast notifications appear in the corner</li>
              </ol>
            </div>

            <Alert>
              <AlertDescription>
                The logs will show all notification-related console messages including:
                real-time notifications, toast processing, and skip logic.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
