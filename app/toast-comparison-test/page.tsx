"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function ToastComparisonTestPage() {
  const { user, activeRole } = useAuth();
  const [testResults, setTestResults] = useState<any[]>([]);

  const simulateMessage = async (direction: 'customer-to-provider' | 'provider-to-customer') => {
    if (!user?.id || !activeRole) return;

    const timestamp = new Date().toLocaleTimeString();
    
    try {
      // Simulate the exact logic from realtime-chat.ts
      let senderId: string;
      let senderType: 'customer' | 'provider';
      let recipientId: string;
      let recipientType: 'customer' | 'provider';
      let senderName: string;

      if (direction === 'customer-to-provider') {
        // Customer sending to provider
        senderId = 'customer-test-id';
        senderType = 'customer';
        recipientId = user.id; // Current user (provider)
        recipientType = 'provider';
        senderName = 'Test Customer';
      } else {
        // Provider sending to customer  
        senderId = user.id; // Current user (provider)
        senderType = 'provider';
        recipientId = 'customer-test-id';
        recipientType = 'customer';
        senderName = 'Test Provider';
      }

      console.log(`🔔 [TOAST TEST] Simulating ${direction}:`, {
        senderId,
        senderType,
        recipientId,
        recipientType,
        senderName
      });

      // Create notification using the same logic as chat
      const notificationResult = await fetch('/api/test-chat-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId,
          senderType,
          recipientId,
          recipientType,
          senderName,
          content: `Test message ${direction} at ${timestamp}`,
          conversationId: 'test-conversation-123'
        })
      });

      const result = await notificationResult.json();
      
      setTestResults(prev => [{
        timestamp,
        direction,
        ...result,
        expected: `Toast should appear for ${recipientType} ${recipientId}`
      }, ...prev.slice(0, 9)]);

    } catch (error: any) {
      setTestResults(prev => [{
        timestamp,
        direction,
        error: error.message,
        success: false
      }, ...prev.slice(0, 9)]);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertDescription>Please log in to test toast notifications.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-6">
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">🍞 Toast Comparison Test</h1>
          <p className="text-muted-foreground">
            Compare customer→provider vs provider→customer toast notifications
          </p>
          <Badge>{activeRole} {user.id}</Badge>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Test Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button 
                onClick={() => simulateMessage('customer-to-provider')}
                className="flex-1"
              >
                📥 Simulate Customer → Provider
              </Button>
              
              <Button 
                onClick={() => simulateMessage('provider-to-customer')}
                className="flex-1"
              >
                📤 Simulate Provider → Customer
              </Button>
            </div>

            <Alert>
              <AlertDescription>
                Watch the bottom-right corner for toast notifications after clicking the buttons.
                Both directions should show toasts with the same behavior.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test Results ({testResults.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {testResults.length === 0 ? (
                <div className="text-muted-foreground">No test results yet. Click the buttons above to test.</div>
              ) : (
                testResults.map((result, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant={result.direction === 'customer-to-provider' ? 'default' : 'secondary'}>
                        {result.direction}
                      </Badge>
                      <span className="text-sm text-muted-foreground">{result.timestamp}</span>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div><strong>Success:</strong> {result.success ? '✅' : '❌'}</div>
                      {result.expected && <div><strong>Expected:</strong> {result.expected}</div>}
                      {result.notificationId && <div><strong>Notification ID:</strong> {result.notificationId}</div>}
                      {result.skipToast !== undefined && <div><strong>Skip Toast:</strong> {result.skipToast ? 'Yes' : 'No'}</div>}
                      {result.error && <div className="text-red-600"><strong>Error:</strong> {result.error}</div>}
                    </div>

                    {result.debug && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-sm font-medium">Debug Info</summary>
                        <pre className="bg-gray-100 p-2 rounded mt-2 text-xs overflow-auto">
                          {JSON.stringify(result.debug, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>📋 What to Look For</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="space-y-1 text-sm">
              <div>✅ <strong>Customer → Provider:</strong> Should show toast notification</div>
              <div>✅ <strong>Provider → Customer:</strong> Should show toast notification</div>
              <div>❌ <strong>If one direction doesn't work:</strong> Check the debug info below</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
