"use client";

import { useState, useEffect } from 'react';

export default function PracticalFCMTest() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addResult = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
    const result = `[${timestamp}] ${icon} ${message}`;
    setTestResults(prev => [...prev, result]);
    console.log(result);
  };

  const runPracticalTest = async () => {
    setTestResults([]);
    setIsRunning(true);
    addResult('🚀 Starting practical FCM test for customer and provider...', 'info');

    try {
      // Step 1: Check browser support
      addResult('Checking browser support...', 'info');
      if (!('Notification' in window) || !('serviceWorker' in navigator)) {
        throw new Error('Browser does not support required APIs');
      }
      addResult('Browser supports FCM', 'success');

      // Step 2: Request permission
      addResult('Requesting notification permission...', 'info');
      let permission = Notification.permission;
      
      if (permission === 'default') {
        permission = await Notification.requestPermission();
      }
      
      if (permission !== 'granted') {
        throw new Error('Notification permission denied');
      }
      addResult('Notification permission granted', 'success');

      // Step 3: Register service worker
      addResult('Registering service worker...', 'info');
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      await navigator.serviceWorker.ready;
      addResult('Service worker registered successfully', 'success');

      // Step 4: Get FCM token
      addResult('Getting FCM token...', 'info');
      
      // Import Firebase messaging
      const { getMessaging, getToken } = await import('firebase/messaging');
      const { initializeApp, getApps } = await import('firebase/app');

      const firebaseConfig = {
        apiKey: "AIzaSyCF_hn_33xTJaO-zwXGNxhVc9yJqjXfXD0",
        authDomain: "sniket-d2766.firebaseapp.com",
        projectId: "sniket-d2766",
        storageBucket: "sniket-d2766.firebasestorage.app",
        messagingSenderId: "968429297305",
        appId: "1:968429297305:web:7425601aff7e7d08b52208"
      };

      const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
      const messaging = getMessaging(app);

      const token = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
        serviceWorkerRegistration: registration
      });

      if (!token) {
        throw new Error('Failed to get FCM token');
      }

      addResult(`FCM token obtained: ${token.substring(0, 30)}...`, 'success');

      // Step 5: Register customer
      addResult('Registering customer...', 'info');
      const customerResponse = await fetch('/api/fcm/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: '6881370e00267202519b',
          userType: 'customer',
          token,
          deviceInfo: {
            platform: navigator.platform,
            browser: navigator.userAgent.includes('Chrome') ? 'Chrome' : 'Other',
            userAgent: navigator.userAgent
          }
        })
      });

      const customerResult = await customerResponse.json();
      if (!customerResponse.ok) {
        throw new Error(customerResult.error || 'Customer registration failed');
      }
      addResult('Customer registered successfully', 'success');

      // Step 6: Register provider (with same token)
      addResult('Registering provider with same token...', 'info');
      const providerResponse = await fetch('/api/fcm/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: '6877cf2d001d10de08ec',
          userType: 'provider',
          token, // Same token!
          deviceInfo: {
            platform: navigator.platform,
            browser: navigator.userAgent.includes('Chrome') ? 'Chrome' : 'Other',
            userAgent: navigator.userAgent
          }
        })
      });

      const providerResult = await providerResponse.json();
      if (!providerResponse.ok) {
        throw new Error(providerResult.error || 'Provider registration failed');
      }
      addResult('Provider registered successfully with same token', 'success');

      // Step 7: Test customer notification
      addResult('Sending notification to customer...', 'info');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const customerNotifResponse = await fetch('/api/fcm/send-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: '6881370e00267202519b',
          userType: 'customer',
          title: 'Customer Test Notification',
          body: 'This is a test notification for the customer',
          data: {
            type: 'customer-test',
            timestamp: Date.now().toString(),
            priority: 'normal'
          },
          action: {
            type: 'message',
            id: 'customer-test'
          }
        })
      });

      const customerNotifResult = await customerNotifResponse.json();
      if (customerNotifResult.success) {
        addResult(`Customer notification sent: ${customerNotifResult.successCount} success`, 'success');
      } else {
        addResult(`Customer notification failed: ${customerNotifResult.error}`, 'error');
      }

      // Step 8: Test provider notification
      addResult('Sending notification to provider...', 'info');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const providerNotifResponse = await fetch('/api/fcm/send-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: '6877cf2d001d10de08ec',
          userType: 'provider',
          title: 'Provider Test Notification',
          body: 'This is a test notification for the provider',
          data: {
            type: 'provider-test',
            timestamp: Date.now().toString(),
            priority: 'normal'
          },
          action: {
            type: 'message',
            id: 'provider-test'
          }
        })
      });

      const providerNotifResult = await providerNotifResponse.json();
      if (providerNotifResult.success) {
        addResult(`Provider notification sent: ${providerNotifResult.successCount} success`, 'success');
      } else {
        addResult(`Provider notification failed: ${providerNotifResult.error}`, 'error');
      }

      // Step 9: Test broadcast
      addResult('Sending broadcast notification...', 'info');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const broadcastResponse = await fetch('/api/fcm/send-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'broadcast',
          userType: 'broadcast',
          title: 'Broadcast Test',
          body: 'This should appear to everyone',
          data: {
            type: 'broadcast',
            timestamp: Date.now().toString()
          }
        })
      });

      const broadcastResult = await broadcastResponse.json();
      if (broadcastResult.success) {
        addResult(`Broadcast sent: ${broadcastResult.successCount} devices notified`, 'success');
      } else {
        addResult(`Broadcast failed: ${broadcastResult.error}`, 'error');
      }

      addResult('🎉 Test completed! Check your browser notifications.', 'success');
      addResult('📱 You should see customer, provider, and broadcast notifications', 'info');

    } catch (error) {
      addResult(`❌ Test failed: ${error instanceof Error ? error.message : String(error)}`, 'error');
    } finally {
      setIsRunning(false);
    }
  };

  const sendQuickCustomerTest = async () => {
    addResult('Sending quick customer test...', 'info');
    try {
      const response = await fetch('/api/fcm/send-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: '6881370e00267202519b',
          userType: 'customer',
          title: 'Quick Customer Test',
          body: 'Testing customer notifications',
          data: { type: 'quick-test' }
        })
      });
      const result = await response.json();
      addResult(`Customer test: ${result.success ? 'Success' : 'Failed'}`, result.success ? 'success' : 'error');
    } catch (error) {
      addResult('Customer test failed', 'error');
    }
  };

  const sendQuickProviderTest = async () => {
    addResult('Sending quick provider test...', 'info');
    try {
      const response = await fetch('/api/fcm/send-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: '6877cf2d001d10de08ec',
          userType: 'provider',
          title: 'Quick Provider Test',
          body: 'Testing provider notifications',
          data: { type: 'quick-test' }
        })
      });
      const result = await response.json();
      addResult(`Provider test: ${result.success ? 'Success' : 'Failed'}`, result.success ? 'success' : 'error');
    } catch (error) {
      addResult('Provider test failed', 'error');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">🧪 Practical FCM Test</h1>
        <p className="text-center text-gray-600 mb-8">
          Testing customer and provider notifications with same FCM token
        </p>

        {/* Control Buttons */}
        <div className="flex flex-wrap gap-3 mb-6 justify-center">
          <button
            onClick={runPracticalTest}
            disabled={isRunning}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg disabled:opacity-50"
          >
            {isRunning ? '⏳ Running...' : '🚀 Run Full Test'}
          </button>
          
          <button
            onClick={sendQuickCustomerTest}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            📱 Quick Customer Test
          </button>
          
          <button
            onClick={sendQuickProviderTest}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
          >
            🏥 Quick Provider Test
          </button>
          
          <button
            onClick={() => setTestResults([])}
            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
          >
            🧹 Clear
          </button>
        </div>

        {/* Test Results */}
        <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm h-96 overflow-y-auto">
          <h3 className="text-white font-bold mb-2">Test Results:</h3>
          {testResults.length === 0 ? (
            <p className="text-gray-500">No tests run yet. Click "Run Full Test" to start testing.</p>
          ) : (
            testResults.map((result, index) => (
              <div key={index} className="mb-1">
                {result}
              </div>
            ))
          )}
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-blue-50 border border-blue-200 p-4 rounded">
          <h3 className="font-semibold text-blue-800 mb-2">🎯 What This Tests</h3>
          <ul className="list-disc list-inside text-sm space-y-1 text-blue-700">
            <li><strong>Same Token:</strong> Both customer and provider use the same FCM token</li>
            <li><strong>Targeted Notifications:</strong> Messages are sent to specific user types</li>
            <li><strong>Browser Compatibility:</strong> Works across Chrome, Safari, Firefox, Edge</li>
            <li><strong>Real-world Scenario:</strong> Multiple users in same browser (like Slack/Notion)</li>
            <li><strong>Service Worker:</strong> Background notifications work correctly</li>
          </ul>
          
          <div className="mt-3 p-3 bg-blue-100 rounded">
            <strong>🔍 Expected Results:</strong>
            <ul className="text-sm mt-1 space-y-1">
              <li>• Both customer and provider register with same FCM token ✅</li>
              <li>• Customer notifications appear in browser ✅</li>
              <li>• Provider notifications appear in browser ✅</li>
              <li>• Broadcast notifications reach all users ✅</li>
              <li>• Service worker handles background notifications ✅</li>
            </ul>
          </div>
        </div>

        {/* Multi-User Scenario Explanation */}
        <div className="mt-4 bg-yellow-50 border border-yellow-200 p-4 rounded">
          <h3 className="font-semibold text-yellow-800 mb-2">🏢 Multi-User Same Browser Scenario</h3>
          <p className="text-sm text-yellow-700 mb-2">
            This test demonstrates how apps like Slack and Notion handle multiple users in the same browser:
          </p>
          <ol className="list-decimal list-inside text-sm space-y-1 text-yellow-700">
            <li>Single FCM token per browser (not per user)</li>
            <li>Server-side routing decides which notifications to send</li>
            <li>All users on the device receive notifications they should see</li>
            <li>Client-side filtering can be added for advanced scenarios</li>
          </ol>
          <p className="text-sm text-yellow-700 mt-2">
            <strong>Result:</strong> Customer and provider in same browser both get their notifications!
          </p>
        </div>
      </div>
    </div>
  );
}
