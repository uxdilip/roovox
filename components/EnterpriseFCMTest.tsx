"use client";

import { useState } from 'react';
import { useEnterpriseFCM } from '@/hooks/use-enterprise-fcm';

export default function EnterpriseFCMTest() {
  const [selectedUserId, setSelectedUserId] = useState('6881370e00267202519b'); // Customer ID
  const [selectedUserType, setSelectedUserType] = useState<'customer' | 'provider' | 'admin'>('customer');
  const [status, setStatus] = useState('');

  // Enterprise FCM for customer
  const customerFCM = useEnterpriseFCM({
    userId: '6881370e00267202519b',
    userType: 'customer',
    userInfo: { email: 'customer@test.com', name: 'Test Customer' },
    autoRegister: false // Manual control for testing
  });

  // Enterprise FCM for provider
  const providerFCM = useEnterpriseFCM({
    userId: '6877cf2d001d10de08ec',
    userType: 'provider', 
    userInfo: { email: 'provider@test.com', name: 'Test Provider' },
    autoRegister: false // Manual control for testing
  });

  const registerCustomer = async () => {
    setStatus('Registering customer...');
    try {
      if (customerFCM.permission !== 'granted') {
        const granted = await customerFCM.requestPermission();
        if (!granted) {
          setStatus('❌ Permission denied for customer');
          return;
        }
      }
      await customerFCM.register();
      setStatus('✅ Customer registered successfully');
    } catch (error) {
      setStatus('❌ Customer registration failed: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  const registerProvider = async () => {
    setStatus('Registering provider...');
    try {
      if (providerFCM.permission !== 'granted') {
        const granted = await providerFCM.requestPermission();
        if (!granted) {
          setStatus('❌ Permission denied for provider');
          return;
        }
      }
      await providerFCM.register();
      setStatus('✅ Provider registered successfully');
    } catch (error) {
      setStatus('❌ Provider registration failed: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  const sendEnterpriseNotification = async () => {
    setStatus(`Sending enterprise notification to ${selectedUserType}...`);
    try {
      const response = await fetch('/api/fcm/enterprise/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId: selectedUserId,
          targetUserType: selectedUserType,
          title: `Enterprise Test - ${selectedUserType.toUpperCase()}`,
          body: `This is an enterprise notification for ${selectedUserType} ${selectedUserId}`,
          data: {
            type: 'enterprise-test',
            timestamp: Date.now().toString(),
            priority: 'high'
          },
          clickAction: `/${selectedUserType}/dashboard`
        })
      });

      const result = await response.json();
      if (result.success) {
        setStatus(`✅ Enterprise notification sent: ${result.results.successCount} success, ${result.results.failureCount} failed`);
      } else {
        setStatus(`❌ Enterprise notification failed: ${result.error}`);
      }
    } catch (error) {
      setStatus('❌ Error sending enterprise notification: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  const sendBroadcastNotification = async () => {
    setStatus('Sending broadcast notification...');
    try {
      const response = await fetch('/api/fcm/enterprise/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // No target specified = broadcast
          title: 'Enterprise Broadcast',
          body: 'This notification should appear to all active users',
          data: {
            type: 'broadcast',
            timestamp: Date.now().toString(),
            priority: 'normal'
          }
        })
      });

      const result = await response.json();
      setStatus(`📢 Broadcast sent: ${result.results?.successCount || 0} devices notified`);
    } catch (error) {
      setStatus('❌ Broadcast failed: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  const testUserTypeNotification = async (targetType: 'customer' | 'provider') => {
    setStatus(`Testing ${targetType} type notification...`);
    try {
      const response = await fetch('/api/fcm/enterprise/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserType: targetType,
          title: `${targetType.toUpperCase()} Notification`,
          body: `This message is for all ${targetType}s`,
          data: {
            type: 'user-type-test',
            timestamp: Date.now().toString()
          }
        })
      });

      const result = await response.json();
      setStatus(`📋 ${targetType} notification: ${result.results?.successCount || 0} devices reached`);
    } catch (error) {
      setStatus(`❌ ${targetType} notification failed: ` + (error instanceof Error ? error.message : String(error)));
    }
  };

  const getAllActiveUsers = () => {
    const allUsers = [...customerFCM.activeUsers, ...providerFCM.activeUsers];
    const uniqueUsers = allUsers.filter((user, index, self) => 
      index === self.findIndex(u => u.userId === user.userId)
    );
    return uniqueUsers;
  };

  const clearRegistrations = async () => {
    await customerFCM.unregister();
    await providerFCM.unregister();
    setStatus('🧹 All registrations cleared');
  };

  return (
    <div className="p-6 border rounded-lg bg-gradient-to-r from-blue-50 to-purple-50">
      <h3 className="font-bold text-xl mb-4 text-blue-800">🏢 Enterprise FCM Test Suite</h3>
      
      {/* Registration Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-4 rounded border">
          <h4 className="font-semibold text-blue-600 mb-2">Customer Registration</h4>
          <p className="text-sm text-gray-600 mb-2">
            Status: {customerFCM.isRegistered ? '✅ Registered' : '❌ Not Registered'}
          </p>
          <p className="text-sm text-gray-600 mb-2">
            Permission: {customerFCM.permission || 'Not requested'}
          </p>
          <button 
            onClick={registerCustomer} 
            disabled={customerFCM.isLoading}
            className="bg-blue-500 text-white px-3 py-1 rounded disabled:opacity-50"
          >
            {customerFCM.isLoading ? 'Registering...' : 'Register Customer'}
          </button>
        </div>

        <div className="bg-white p-4 rounded border">
          <h4 className="font-semibold text-green-600 mb-2">Provider Registration</h4>
          <p className="text-sm text-gray-600 mb-2">
            Status: {providerFCM.isRegistered ? '✅ Registered' : '❌ Not Registered'}
          </p>
          <p className="text-sm text-gray-600 mb-2">
            Permission: {providerFCM.permission || 'Not requested'}
          </p>
          <button 
            onClick={registerProvider} 
            disabled={providerFCM.isLoading}
            className="bg-green-500 text-white px-3 py-1 rounded disabled:opacity-50"
          >
            {providerFCM.isLoading ? 'Registering...' : 'Register Provider'}
          </button>
        </div>
      </div>

      {/* Testing Section */}
      <div className="bg-white p-4 rounded border mb-4">
        <h4 className="font-semibold text-purple-600 mb-3">Enterprise Notification Testing</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Target User ID:</label>
            <select 
              value={selectedUserId} 
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full border rounded px-2 py-1 text-sm"
            >
              <option value="6881370e00267202519b">Customer (6881...)</option>
              <option value="6877cf2d001d10de08ec">Provider (6877...)</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Target User Type:</label>
            <select 
              value={selectedUserType} 
              onChange={(e) => setSelectedUserType(e.target.value as 'customer' | 'provider' | 'admin')}
              className="w-full border rounded px-2 py-1 text-sm"
            >
              <option value="customer">Customer</option>
              <option value="provider">Provider</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <button 
            onClick={sendEnterpriseNotification}
            className="bg-purple-500 text-white px-3 py-1 rounded text-sm"
          >
            Send Targeted Notification
          </button>
          
          <button 
            onClick={sendBroadcastNotification}
            className="bg-orange-500 text-white px-3 py-1 rounded text-sm"
          >
            Send Broadcast
          </button>
          
          <button 
            onClick={() => testUserTypeNotification('customer')}
            className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
          >
            Test All Customers
          </button>
          
          <button 
            onClick={() => testUserTypeNotification('provider')}
            className="bg-green-500 text-white px-3 py-1 rounded text-sm"
          >
            Test All Providers
          </button>
          
          <button 
            onClick={clearRegistrations}
            className="bg-red-500 text-white px-3 py-1 rounded text-sm"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Status Display */}
      <div className="bg-gray-900 text-green-400 p-3 rounded font-mono text-sm mb-4">
        <strong>Status:</strong> {status || 'Ready for testing...'}
      </div>

      {/* Active Users Display */}
      <div className="bg-white p-4 rounded border">
        <h4 className="font-semibold text-gray-700 mb-2">Active Users ({getAllActiveUsers().length})</h4>
        {getAllActiveUsers().length === 0 ? (
          <p className="text-gray-500 text-sm">No users registered</p>
        ) : (
          <div className="space-y-1">
            {getAllActiveUsers().map((user, index) => (
              <div key={index} className="text-sm bg-gray-50 p-2 rounded flex justify-between">
                <span>{user.userType} - {user.userId}</span>
                <span className="text-gray-500">{user.email}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 text-sm text-gray-600">
        <h4 className="font-semibold mb-2">🧪 Testing Instructions:</h4>
        <ol className="list-decimal list-inside space-y-1">
          <li>Register both customer and provider users</li>
          <li>Open multiple tabs (one for customer, one for provider)</li>
          <li>Send targeted notifications and verify only correct tabs show them</li>
          <li>Test broadcast notifications (should appear in all tabs)</li>
          <li>Test user type notifications (should filter by role)</li>
        </ol>
        
        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <strong>🎯 Enterprise Features:</strong>
          <ul className="text-sm mt-1 space-y-1">
            <li>• Single token shared across multiple users (like Slack/Notion)</li>
            <li>• Server-side routing based on user targeting</li>
            <li>• Client-side filtering for appropriate users</li>
            <li>• Automatic cleanup of invalid tokens</li>
            <li>• Enterprise-grade user session management</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
