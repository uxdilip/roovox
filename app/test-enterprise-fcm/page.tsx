"use client";

import { useState, useEffect } from 'react';
import { useEnterpriseFCM } from '@/hooks/use-enterprise-fcm';

export default function EnterpriseFCMTestPage() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [currentTest, setCurrentTest] = useState('');

  // Test customer FCM
  const customerFCM = useEnterpriseFCM({
    userId: '6881370e00267202519b',
    userType: 'customer',
    userInfo: { email: 'customer@test.com', name: 'Test Customer' },
    autoRegister: false
  });

  // Test provider FCM  
  const providerFCM = useEnterpriseFCM({
    userId: '6877cf2d001d10de08ec',
    userType: 'provider',
    userInfo: { email: 'provider@test.com', name: 'Test Provider' },
    autoRegister: false
  });

  const addResult = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
    const result = `[${timestamp}] ${icon} ${message}`;
    setTestResults(prev => [...prev, result]);
  };

  const runFullTest = async () => {
    setTestResults([]);
    setCurrentTest('Running comprehensive enterprise FCM test...');

    try {
      // Step 1: Test browser support
      addResult('Testing browser support...', 'info');
      if (!('Notification' in window) || !('serviceWorker' in navigator)) {
        addResult('Browser does not support required APIs', 'error');
        return;
      }
      addResult('Browser supports enterprise FCM', 'success');

      // Step 2: Request permissions
      addResult('Requesting notification permissions...', 'info');
      const customerPermission = await customerFCM.requestPermission();
      const providerPermission = await providerFCM.requestPermission();
      
      if (customerPermission && providerPermission) {
        addResult('Notification permissions granted', 'success');
      } else {
        addResult('Permission denied - cannot continue test', 'error');
        return;
      }

      // Step 3: Register customer
      addResult('Registering customer...', 'info');
      await customerFCM.register();
      if (customerFCM.isRegistered) {
        addResult(`Customer registered successfully (Token: ${customerFCM.token?.substring(0, 30)}...)`, 'success');
      } else {
        addResult('Customer registration failed', 'error');
        return;
      }

      // Step 4: Register provider  
      addResult('Registering provider...', 'info');
      await providerFCM.register();
      if (providerFCM.isRegistered) {
        addResult(`Provider registered successfully (Token: ${providerFCM.token?.substring(0, 30)}...)`, 'success');
      } else {
        addResult('Provider registration failed', 'error');
        return;
      }

      // Step 5: Verify same token
      if (customerFCM.token === providerFCM.token) {
        addResult('✨ Both users share the same FCM token (correct behavior)', 'success');
      } else {
        addResult('Different tokens detected (unexpected)', 'error');
      }

      // Step 6: Test customer notification
      addResult('Testing customer-specific notification...', 'info');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const customerResponse = await fetch('/api/fcm/enterprise/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId: '6881370e00267202519b',
          targetUserType: 'customer',
          title: 'Customer Test',
          body: 'This notification is for the customer only',
          data: { type: 'customer-test', timestamp: Date.now().toString() }
        })
      });

      const customerResult = await customerResponse.json();
      if (customerResult.success) {
        addResult(`Customer notification sent to ${customerResult.results.successCount} devices`, 'success');
      } else {
        addResult(`Customer notification failed: ${customerResult.error}`, 'error');
      }

      // Step 7: Test provider notification
      addResult('Testing provider-specific notification...', 'info');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const providerResponse = await fetch('/api/fcm/enterprise/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId: '6877cf2d001d10de08ec',
          targetUserType: 'provider', 
          title: 'Provider Test',
          body: 'This notification is for the provider only',
          data: { type: 'provider-test', timestamp: Date.now().toString() }
        })
      });

      const providerResult = await providerResponse.json();
      if (providerResult.success) {
        addResult(`Provider notification sent to ${providerResult.results.successCount} devices`, 'success');
      } else {
        addResult(`Provider notification failed: ${providerResult.error}`, 'error');
      }

      // Step 8: Test broadcast
      addResult('Testing broadcast notification...', 'info');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const broadcastResponse = await fetch('/api/fcm/enterprise/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Broadcast Test',
          body: 'This should appear to all active users',
          data: { type: 'broadcast-test', timestamp: Date.now().toString() }
        })
      });

      const broadcastResult = await broadcastResponse.json();
      if (broadcastResult.success) {
        addResult(`Broadcast sent to ${broadcastResult.results.successCount} devices`, 'success');
      } else {
        addResult(`Broadcast failed: ${broadcastResult.error}`, 'error');
      }

      addResult('🎉 Enterprise FCM test completed!', 'success');
      addResult('📱 Check your browser notifications - you should see targeted messages', 'info');
      
    } catch (error) {
      addResult(`Test failed: ${error instanceof Error ? error.message : String(error)}`, 'error');
    } finally {
      setCurrentTest('');
    }
  };

  const sendQuickCustomerTest = async () => {
    addResult('Sending quick customer test...', 'info');
    await customerFCM.sendTestNotification();
  };

  const sendQuickProviderTest = async () => {
    addResult('Sending quick provider test...', 'info');
    await providerFCM.sendTestNotification();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">🏢 Enterprise FCM Test</h1>
        
        {/* Status Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-blue-50 border border-blue-200 p-4 rounded">
            <h3 className="font-semibold text-blue-800 mb-2">Customer Status</h3>
            <p className="text-sm">Registered: {customerFCM.isRegistered ? '✅' : '❌'}</p>
            <p className="text-sm">Permission: {customerFCM.permission || 'Not requested'}</p>
            <p className="text-sm">Loading: {customerFCM.isLoading ? '⏳' : '✅'}</p>
            <p className="text-sm">Error: {customerFCM.error || 'None'}</p>
            {customerFCM.token && (
              <p className="text-xs mt-2 font-mono bg-blue-100 p-1 rounded">
                Token: {customerFCM.token.substring(0, 40)}...
              </p>
            )}
          </div>

          <div className="bg-green-50 border border-green-200 p-4 rounded">
            <h3 className="font-semibold text-green-800 mb-2">Provider Status</h3>
            <p className="text-sm">Registered: {providerFCM.isRegistered ? '✅' : '❌'}</p>
            <p className="text-sm">Permission: {providerFCM.permission || 'Not requested'}</p>
            <p className="text-sm">Loading: {providerFCM.isLoading ? '⏳' : '✅'}</p>
            <p className="text-sm">Error: {providerFCM.error || 'None'}</p>
            {providerFCM.token && (
              <p className="text-xs mt-2 font-mono bg-green-100 p-1 rounded">
                Token: {providerFCM.token.substring(0, 40)}...
              </p>
            )}
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex flex-wrap gap-3 mb-6 justify-center">
          <button
            onClick={runFullTest}
            disabled={!!currentTest}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg disabled:opacity-50"
          >
            🧪 Run Full Test Suite
          </button>
          
          <button
            onClick={sendQuickCustomerTest}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            📱 Quick Customer Test
          </button>
          
          <button
            onClick={sendQuickProviderTest}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            🏥 Quick Provider Test
          </button>
          
          <button
            onClick={() => setTestResults([])}
            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
          >
            🧹 Clear Results
          </button>
        </div>

        {/* Current Test Status */}
        {currentTest && (
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded mb-4">
            <p className="text-yellow-800 font-medium">{currentTest}</p>
          </div>
        )}

        {/* Test Results */}
        <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm h-96 overflow-y-auto">
          <h3 className="text-white font-bold mb-2">Test Results:</h3>
          {testResults.length === 0 ? (
            <p className="text-gray-500">No tests run yet. Click "Run Full Test Suite" to start.</p>
          ) : (
            testResults.map((result, index) => (
              <div key={index} className="mb-1">
                {result}
              </div>
            ))
          )}
        </div>

        {/* Active Users Display */}
        <div className="mt-6 bg-white border rounded p-4">
          <h3 className="font-semibold mb-2">Active Users</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-blue-600">Customer Users:</h4>
              <p className="text-sm">{customerFCM.activeUsers.length} active</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-green-600">Provider Users:</h4>
              <p className="text-sm">{providerFCM.activeUsers.length} active</p>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-blue-50 border border-blue-200 p-4 rounded">
          <h3 className="font-semibold text-blue-800 mb-2">🎯 Test Instructions</h3>
          <ol className="list-decimal list-inside text-sm space-y-1 text-blue-700">
            <li>Click "Run Full Test Suite" to test the complete enterprise FCM system</li>
            <li>The system will register both customer and provider with the same FCM token</li>
            <li>It will send targeted notifications to each user type</li>
            <li>Check your browser notifications - they should be properly filtered</li>
            <li>Customer notifications should only appear for customer context</li>
            <li>Provider notifications should only appear for provider context</li>
            <li>Broadcast notifications should appear for all users</li>
          </ol>
          
          <div className="mt-3 p-3 bg-blue-100 rounded">
            <strong>🏢 Enterprise Features Being Tested:</strong>
            <ul className="text-sm mt-1 space-y-1">
              <li>• Single FCM token shared between multiple users (like Slack/Notion)</li>
              <li>• Server-side message routing based on user targeting</li>
              <li>• Client-side filtering for appropriate user context</li>
              <li>• Multi-user session management in same browser</li>
              <li>• Cross-browser notification delivery</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
