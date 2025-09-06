"use client";

import { useState } from 'react';
import { MultiUserFCMManager, FCMTokenRegistration } from '@/lib/firebase/multi-user-fcm';

export default function MultiUserFCMTest() {
  const [status, setStatus] = useState('');
  const [registrations, setRegistrations] = useState<FCMTokenRegistration[]>([]);

  const refreshRegistrations = () => {
    const regs = MultiUserFCMManager.getAllRegistrations();
    setRegistrations(regs);
    setStatus(`Found ${regs.length} registrations`);
  };

  const testCustomerRegistration = async () => {
    setStatus('Registering customer...');
    try {
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

      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const token = await getToken(messaging);
        const success = await MultiUserFCMManager.registerToken(token, '6881370e00267202519b', 'customer');
        setStatus(success ? '✅ Customer registered' : '❌ Customer registration failed');
      }
    } catch (error) {
      setStatus('❌ Error: ' + (error instanceof Error ? error.message : String(error)));
    }
    refreshRegistrations();
  };

  const testProviderRegistration = async () => {
    setStatus('Registering provider...');
    try {
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

      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const token = await getToken(messaging);
        const success = await MultiUserFCMManager.registerToken(token, '6877cf2d001d10de08ec', 'provider');
        setStatus(success ? '✅ Provider registered' : '❌ Provider registration failed');
      }
    } catch (error) {
      setStatus('❌ Error: ' + (error instanceof Error ? error.message : String(error)));
    }
    refreshRegistrations();
  };

  const testMessageToCustomer = async () => {
    try {
      const response = await fetch('/api/fcm/send-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: '6881370e00267202519b',
          userType: 'customer',
          title: 'Test Customer Message',
          body: 'This message should only appear in customer tabs',
          data: { type: 'test', source: 'multi-user-test' },
          action: { type: 'message', id: 'test-customer' }
        })
      });
      const result = await response.json();
      setStatus(`📤 Customer msg sent: ${result.successCount} success, ${result.failureCount} failed`);
    } catch (error) {
      setStatus('❌ Error sending customer message: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  const testMessageToProvider = async () => {
    try {
      const response = await fetch('/api/fcm/send-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: '6877cf2d001d10de08ec',
          userType: 'provider',
          title: 'Test Provider Message',
          body: 'This message should only appear in provider tabs',
          data: { type: 'test', source: 'multi-user-test' },
          action: { type: 'message', id: 'test-provider' }
        })
      });
      const result = await response.json();
      setStatus(`📤 Provider msg sent: ${result.successCount} success, ${result.failureCount} failed`);
    } catch (error) {
      setStatus('❌ Error sending provider message: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  const clearAllRegistrations = () => {
    MultiUserFCMManager.clearAllRegistrations();
    setStatus('🧹 Cleared all registrations');
    refreshRegistrations();
  };

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="font-bold text-lg mb-4">Multi-User FCM Test</h3>
      
      <div className="space-y-2 mb-4">
        <button onClick={testCustomerRegistration} className="bg-blue-500 text-white px-3 py-1 rounded mr-2">
          Register Customer
        </button>
        <button onClick={testProviderRegistration} className="bg-green-500 text-white px-3 py-1 rounded mr-2">
          Register Provider
        </button>
        <button onClick={refreshRegistrations} className="bg-gray-500 text-white px-3 py-1 rounded mr-2">
          Refresh
        </button>
        <button onClick={clearAllRegistrations} className="bg-red-500 text-white px-3 py-1 rounded">
          Clear All
        </button>
      </div>

      <div className="space-y-2 mb-4">
        <button onClick={testMessageToCustomer} className="bg-purple-500 text-white px-3 py-1 rounded mr-2">
          Send to Customer
        </button>
        <button onClick={testMessageToProvider} className="bg-orange-500 text-white px-3 py-1 rounded">
          Send to Provider
        </button>
      </div>

      <div className="mb-4">
        <strong>Status:</strong> {status}
      </div>

      <div>
        <strong>Current Registrations ({registrations.length}):</strong>
        {registrations.length === 0 ? (
          <div className="text-gray-500">No registrations found</div>
        ) : (
          <ul className="list-disc list-inside">
            {registrations.map((reg, index) => (
              <li key={index} className="text-sm">
                {reg.userType} {reg.userId} - {reg.deviceInfo.browser} - {reg.token.substring(0, 20)}...
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-4 text-sm text-gray-600">
        <h4 className="font-semibold">Test Instructions:</h4>
        <ol className="list-decimal list-inside">
          <li>Register both customer and provider</li>
          <li>Open multiple tabs (customer tab + provider tab)</li>
          <li>Send messages to each user type</li>
          <li>Verify only the correct tab shows the notification</li>
        </ol>
      </div>
    </div>
  );
}
