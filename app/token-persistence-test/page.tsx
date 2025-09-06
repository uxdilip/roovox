"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function TokenPersistenceTestPage() {
  const { user, activeRole } = useAuth();
  const [localStorageInfo, setLocalStorageInfo] = useState<any>(null);
  const [databaseInfo, setDatabaseInfo] = useState<any>(null);

  const checkTokenPersistence = () => {
    if (!user?.id || !activeRole) return;

    // Check localStorage
    const localStorageKey = `fcm_token_${user.id}_${activeRole}`;
    const cachedToken = localStorage.getItem(localStorageKey);
    
    setLocalStorageInfo({
      key: localStorageKey,
      token: cachedToken,
      exists: !!cachedToken && cachedToken !== 'null'
    });
  };

  const checkDatabaseTokens = async () => {
    if (!user?.id || !activeRole) return;

    try {
      const response = await fetch(`/api/fcm/debug-tokens?userId=${user.id}&userType=${activeRole}`);
      const data = await response.json();
      setDatabaseInfo(data);
    } catch (error: any) {
      setDatabaseInfo({ error: error.message });
    }
  };

  const clearCachedToken = () => {
    if (!user?.id || !activeRole) return;
    
    const localStorageKey = `fcm_token_${user.id}_${activeRole}`;
    localStorage.removeItem(localStorageKey);
    checkTokenPersistence();
  };

  useEffect(() => {
    checkTokenPersistence();
    checkDatabaseTokens();
  }, [user?.id, activeRole]);

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertDescription>Please log in to test token persistence.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-6">
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">🔍 Token Persistence Test</h1>
          <p className="text-muted-foreground">
            Test FCM token caching and database persistence for user: {user.id} ({activeRole})
          </p>
        </div>

        <div className="flex gap-4">
          <Button onClick={checkTokenPersistence} variant="outline">
            Check localStorage
          </Button>
          <Button onClick={checkDatabaseTokens} variant="outline">
            Check Database
          </Button>
          <Button onClick={clearCachedToken} variant="destructive">
            Clear Cache
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>LocalStorage Status</CardTitle>
          </CardHeader>
          <CardContent>
            {localStorageInfo ? (
              <div className="space-y-2">
                <div><strong>Key:</strong> <code>{localStorageInfo.key}</code></div>
                <div>
                  <strong>Status:</strong> 
                  <Badge className="ml-2" variant={localStorageInfo.exists ? 'default' : 'secondary'}>
                    {localStorageInfo.exists ? 'Token Cached' : 'No Cache'}
                  </Badge>
                </div>
                {localStorageInfo.token && (
                  <div><strong>Token:</strong> <code>{localStorageInfo.token.substring(0, 30)}...</code></div>
                )}
              </div>
            ) : (
              <div>No data</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Database Status</CardTitle>
          </CardHeader>
          <CardContent>
            {databaseInfo ? (
              <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-sm">
                {JSON.stringify(databaseInfo, null, 2)}
              </pre>
            ) : (
              <div>Loading...</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>🧪 Test Steps</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">To test the fix:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Go to notification settings and enable push notifications</li>
                <li>Check that both localStorage and database show tokens</li>
                <li>Refresh this page - you should see cached token loads instantly</li>
                <li>Clear cache and refresh - should load from database</li>
                <li>Navigate away and back - notifications should stay enabled</li>
              </ol>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={() => window.open('/notification-settings', '_blank')}
                variant="outline"
              >
                🔧 Notification Settings
              </Button>
              <Button 
                onClick={() => window.location.reload()}
                variant="outline"
              >
                🔄 Refresh Page
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
