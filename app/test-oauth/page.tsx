"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createGoogleOAuthSession, GOOGLE_OAUTH_ENABLED, getOAuthUrls } from '@/lib/appwrite';

export default function TestOAuthPage() {
  const [status, setStatus] = useState<string>('Ready to test');
  const [loading, setLoading] = useState(false);

  const testGoogleOAuth = async () => {
    setLoading(true);
    setStatus('Testing Google OAuth...');
    
    try {
      const { successUrl, failureUrl } = getOAuthUrls('/customer/dashboard');
      
      console.log('🔐 Testing Google OAuth with:', {
        enabled: GOOGLE_OAUTH_ENABLED,
        successUrl,
        failureUrl,
        endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT,
        projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID,
        appUrl: process.env.NEXT_PUBLIC_APP_URL
      });

      if (!GOOGLE_OAUTH_ENABLED) {
        throw new Error('Google OAuth is not enabled');
      }

      await createGoogleOAuthSession(successUrl, failureUrl);
      setStatus('✅ Google OAuth initiated successfully! Check browser for redirect.');
      
    } catch (error: any) {
      console.error('❌ Google OAuth test failed:', error);
      setStatus(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const checkEnvironment = () => {
    const envVars = {
      'NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED': process.env.NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED,
      'NEXT_PUBLIC_APPWRITE_ENDPOINT': process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT,
      'NEXT_PUBLIC_APPWRITE_PROJECT_ID': process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID,
      'GOOGLE_CLIENT_ID': process.env.GOOGLE_CLIENT_ID ? '✅ Set' : '❌ Not set',
      'GOOGLE_CLIENT_SECRET': process.env.GOOGLE_CLIENT_SECRET ? '✅ Set' : '❌ Not set',
    };

    console.log('🌍 Environment Variables:', envVars);
    setStatus('Environment variables logged to console. Check browser console.');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Google OAuth Test Page
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-gray-600 mb-4">
              This page helps test and debug Google OAuth functionality
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">Current Status:</h3>
              <p className="text-blue-800">{status}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={checkEnvironment}
                variant="outline"
                className="w-full"
              >
                Check Environment Variables
              </Button>

              <Button
                onClick={testGoogleOAuth}
                disabled={loading || !GOOGLE_OAUTH_ENABLED}
                className="w-full"
              >
                {loading ? 'Testing...' : 'Test Google OAuth'}
              </Button>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Configuration:</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• OAuth Enabled: {GOOGLE_OAUTH_ENABLED ? '✅ Yes' : '❌ No'}</li>
                <li>• Appwrite Endpoint: {process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'Not set'}</li>
                <li>• Project ID: {process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || 'Not set'}</li>
                <li>• App URL: {process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}</li>
                <li>• Google Client ID: {process.env.GOOGLE_CLIENT_ID ? '✅ Set' : '❌ Not set'}</li>
                <li>• Google Client Secret: {process.env.GOOGLE_CLIENT_SECRET ? '✅ Set' : '❌ Not set'}</li>
              </ul>
            </div>

            <div className="p-4 bg-yellow-50 rounded-lg">
              <h3 className="font-semibold text-yellow-900 mb-2">Instructions:</h3>
              <ol className="text-sm text-yellow-800 space-y-1 list-decimal list-inside">
                <li>Click "Check Environment Variables" to see current config</li>
                <li>Click "Test Google OAuth" to initiate OAuth flow</li>
                <li>Check browser console for detailed logs</li>
                <li>Monitor network tab for OAuth requests</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 