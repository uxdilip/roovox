"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ForceProviderFCMRegistration from '@/components/ForceProviderFCMRegistration';
import MultiUserFCMTest from '@/components/MultiUserFCMTest';
import EnterpriseFCMTest from '@/components/EnterpriseFCMTest';

export default function DebugPushPage() {
  const { user, activeRole } = useAuth();
  const [logs, setLogs] = useState<string[]>([]);
  const [swRegistration, setSWRegistration] = useState<ServiceWorkerRegistration | null>(null);

  const addLog = (message: string) => {
    console.log(message);
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  useEffect(() => {
    checkPushSetup();
  }, []);

  const checkPushSetup = async () => {
    addLog("🔍 Starting push notification diagnostics...");

    // 1. Check basic browser support
    if (!('Notification' in window)) {
      addLog("❌ Browser doesn't support notifications");
      return;
    }
    addLog("✅ Browser supports notifications");

    if (!('serviceWorker' in navigator)) {
      addLog("❌ Browser doesn't support service workers");
      return;
    }
    addLog("✅ Browser supports service workers");

    // 2. Check notification permission
    const permission = Notification.permission;
    addLog(`🔔 Notification permission: ${permission}`);
    
    if (permission === 'denied') {
      addLog("❌ Notifications are blocked. Please allow in browser settings.");
      return;
    }

    // 3. Check service worker registration
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      addLog(`📱 Found ${registrations.length} service worker registrations`);
      
      const fcmSW = registrations.find(reg => 
        reg.scope.includes('firebase-messaging-sw') || 
        reg.active?.scriptURL.includes('firebase-messaging-sw')
      );
      
      if (fcmSW) {
        addLog(`✅ FCM Service Worker found: ${fcmSW.active?.scriptURL}`);
        addLog(`📊 SW State: ${fcmSW.active?.state}`);
        setSWRegistration(fcmSW);
      } else {
        addLog("❌ FCM Service Worker not found");
        
        // Try to register it
        try {
          const reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
          addLog(`✅ Registered FCM Service Worker: ${reg.scope}`);
          setSWRegistration(reg);
        } catch (error) {
          addLog(`❌ Failed to register SW: ${error}`);
        }
      }
    } catch (error) {
      addLog(`❌ Error checking service workers: ${error}`);
    }

    // 4. Check FCM token in localStorage
    if (user?.id && activeRole) {
      const tokenKey = `fcm_token_${user.id}_${activeRole}`;
      const cachedToken = localStorage.getItem(tokenKey);
      if (cachedToken && cachedToken !== 'null') {
        addLog(`✅ FCM token found: ${cachedToken.substring(0, 30)}...`);
      } else {
        addLog("❌ No FCM token in localStorage");
      }
    }

    // 5. Check if we can access Firebase messaging
    try {
      const { getMessagingInstance } = await import('@/lib/firebase/config');
      const messaging = await getMessagingInstance();
      if (messaging) {
        addLog("✅ Firebase messaging instance available");
      } else {
        addLog("❌ Firebase messaging not available");
      }
    } catch (error) {
      addLog(`❌ Error accessing Firebase messaging: ${error}`);
    }
  };

  const testForegroundMessage = async () => {
    addLog("🧪 Testing foreground message handling...");
    
    try {
      const { getMessagingInstance } = await import('@/lib/firebase/config');
      const { onMessage } = await import('firebase/messaging');
      
      const messaging = await getMessagingInstance();
      if (!messaging) {
        addLog("❌ No messaging instance");
        return;
      }

      // Set up foreground listener
      const unsubscribe = onMessage(messaging, (payload) => {
        addLog(`✅ Received foreground message: ${JSON.stringify(payload)}`);
      });

      addLog("✅ Foreground listener set up");
      
      // Clean up after 30 seconds
      setTimeout(() => {
        unsubscribe();
        addLog("🧹 Cleaned up foreground listener");
      }, 30000);

    } catch (error) {
      addLog(`❌ Error setting up foreground listener: ${error}`);
    }
  };

  const testBackgroundMessage = async () => {
    addLog("🧪 Testing background message handling...");
    
    try {
      const { testServiceWorkerCommunication } = await import('@/lib/firebase/messaging');
      const result = await testServiceWorkerCommunication();
      
      if (result.success) {
        addLog("✅ Service Worker communication test passed");
        addLog("📨 Service Worker is responding to messages correctly");
      } else {
        addLog(`❌ Service Worker communication failed: ${result.error}`);
      }
    } catch (error: any) {
      addLog(`❌ Error testing service worker: ${error.message}`);
    }
  };

  const testDirectNotification = async () => {
    addLog("🔔 Testing direct notification display...");
    
    try {
      if (!('serviceWorker' in navigator)) {
        addLog("❌ Service Worker not supported");
        return;
      }

      const registration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
      if (!registration) {
        addLog("❌ No service worker registration found");
        return;
      }

      // Test if service worker can show notifications directly
      await registration.showNotification('Test Background Notification', {
        body: 'This is a test background notification from the debug page',
        icon: '/assets/logo.png',
        badge: '/assets/badge.png',
        tag: 'test_direct',
        requireInteraction: false,
        data: {
          clickAction: '/',
          type: 'test',
          id: 'test_direct',
          timestamp: Date.now()
        }
      });

      addLog("✅ Direct notification sent to service worker");
      addLog("📱 Check if you see a notification popup!");
      
    } catch (error: any) {
      addLog(`❌ Error showing direct notification: ${error.message}`);
    }
  };

  const testSimpleServiceWorker = async () => {
    addLog("🧪 Testing simple service worker execution...");
    
    try {
      if (!('serviceWorker' in navigator)) {
        addLog("❌ Service Worker not supported");
        return;
      }

      // Check current registrations first
      const existingRegs = await navigator.serviceWorker.getRegistrations();
      addLog(`📋 Existing service workers: ${existingRegs.length}`);
      
      // First try to register a simple test service worker
      addLog("📝 Registering simple test service worker...");
      const testRegistration = await navigator.serviceWorker.register('/test-sw.js');
      addLog("✅ Simple test service worker registered");
      
      // Log more details about the registration
      addLog(`📋 Registration scope: ${testRegistration.scope}`);
      addLog(`📋 Registration active: ${!!testRegistration.active}`);
      addLog(`📋 Registration installing: ${!!testRegistration.installing}`);
      addLog(`📋 Registration waiting: ${!!testRegistration.waiting}`);
      
      // Wait for it to activate
      await navigator.serviceWorker.ready;
      addLog("✅ Simple test service worker ready");
      
      // Try to communicate with it
      if (testRegistration.active) {
        addLog("📨 Sending test message to simple service worker...");
        testRegistration.active.postMessage({ type: 'HELLO', from: 'debug-page' });
      }
      
      // Check console for test logs
      addLog("📋 Check console for '🧪 TEST SW:' logs from the simple service worker");
      addLog("⚠️ If you don't see those logs, Safari isn't executing SW JavaScript");
      
      // Also check Safari Developer menu
      addLog("🔍 Also check: Safari → Develop → Service Workers");
      
      // Clean up - unregister the test service worker
      setTimeout(async () => {
        await testRegistration.unregister();
        addLog("🧹 Cleaned up test service worker");
      }, 5000);
      
    } catch (error: any) {
      addLog(`❌ Error with simple service worker: ${error.message}`);
    }
  };

  const testSimpleFCMServiceWorker = async () => {
    addLog("🧪 Testing simple FCM service worker...");
    
    try {
      if (!('serviceWorker' in navigator)) {
        addLog("❌ Service Worker not supported");
        return;
      }

      // Register simple FCM service worker
      addLog("📝 Registering simple FCM service worker...");
      const registration = await navigator.serviceWorker.register('/simple-fcm-sw.js');
      addLog("✅ Simple FCM service worker registered");
      
      // Wait for it to activate
      await navigator.serviceWorker.ready;
      addLog("✅ Simple FCM service worker ready");
      
      // Test communication
      if (registration.active) {
        addLog("📨 Testing communication with simple FCM service worker...");
        const messageChannel = new MessageChannel();
        
        messageChannel.port1.onmessage = (event) => {
          if (event.data?.type === 'SIMPLE_SW_RESPONSE') {
            addLog("✅ Simple FCM service worker responded!");
          }
        };
        
        registration.active.postMessage(
          { type: 'TEST_MESSAGE', timestamp: Date.now() },
          [messageChannel.port2]
        );
      }
      
      addLog("📋 Check console for '🧪 SIMPLE FCM SW:' logs");
      addLog("📋 If you see those logs, Safari CAN execute service workers");
      addLog("📋 If not, there's a fundamental Safari service worker issue");
      
      // Clean up after test
      setTimeout(async () => {
        await registration.unregister();
        addLog("🧹 Cleaned up simple FCM service worker");
      }, 10000);
      
    } catch (error: any) {
      addLog(`❌ Error with simple FCM service worker: ${error.message}`);
    }
  };

  const testFCMDebug = async () => {
    addLog("🔍 Testing FCM service worker setup...");
    
    try {
      if (!('serviceWorker' in navigator)) {
        addLog("❌ Service Worker not supported");
        return;
      }

      const registration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
      if (!registration) {
        addLog("❌ No service worker registration found");
        return;
      }

      const activeServiceWorker = registration.active;
      if (!activeServiceWorker) {
        addLog("❌ Service worker not active");
        return;
      }

      // Test FCM debug communication
      return new Promise((resolve) => {
        const messageChannel = new MessageChannel();
        
        messageChannel.port1.onmessage = (event) => {
          console.log('📨 FCM Debug response from SW:', event.data);
          if (event.data?.type === 'FCM_DEBUG_RESPONSE') {
            const data = event.data.data;
            addLog(`📱 FCM Messaging exists: ${data.messagingExists ? '✅' : '❌'}`);
            addLog(`📱 onBackgroundMessage registered: ${data.onBackgroundMessageRegistered ? '✅' : '❌'}`);
            resolve(true);
          }
        };

        // Send FCM debug message to service worker
        activeServiceWorker.postMessage(
          { type: 'FCM_DEBUG', timestamp: Date.now() },
          [messageChannel.port2]
        );

        // Timeout after 5 seconds
        setTimeout(() => {
          addLog("❌ FCM debug communication timeout");
          resolve(false);
        }, 5000);
      });

    } catch (error: any) {
      addLog(`❌ Error testing FCM debug: ${error.message}`);
    }
  };

    const sendTestNotification = async () => {
    if (!user?.id || !activeRole) {
      addLog("❌ No user logged in");
      return;
    }

    addLog("🚀 Sending test notification...");
    
    try {
      const response = await fetch('/api/fcm/send-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          userType: activeRole,
          title: 'Test Push Notification',
          body: 'This is a test from the debug page',
          data: {
            type: 'system',
            category: 'test',
            priority: 'normal'
          },
          action: {
            type: 'system',
            id: 'test'
          },
          priority: 'normal'
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        addLog(`✅ Test notification sent: ${JSON.stringify(result)}`);
      } else {
        addLog(`❌ Failed to send notification: ${result.error || result.reason}`);
      }
    } catch (error: any) {
      addLog(`❌ Error sending notification: ${error.message}`);
    }
  };

  const sendDataOnlyNotification = async () => {
    if (!user?.id || !activeRole) {
      addLog("❌ No user logged in");
      return;
    }

    addLog("🚀 Sending data-only notification (for background testing)...");
    
    try {
      const response = await fetch('/api/fcm/send-data-only', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          userType: activeRole,
          title: 'Test Data-Only Push',
          body: 'This should trigger onBackgroundMessage',
          data: {
            type: 'message',
            category: 'test',
            priority: 'normal',
            notificationTitle: 'Test Data-Only Push',
            notificationBody: 'This should trigger onBackgroundMessage'
          },
          action: {
            type: 'message',
            id: 'test_data_only'
          },
          priority: 'normal'
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        addLog(`✅ Data-only notification sent: ${JSON.stringify(result)}`);
        addLog("📱 Close browser tab and check for background notification!");
      } else {
        addLog(`❌ Failed to send data-only notification: ${result.error || result.reason}`);
      }
    } catch (error: any) {
      addLog(`❌ Error sending data-only notification: ${error.message}`);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const testCompleteBackgroundFlow = async () => {
    if (!user?.id || !activeRole) {
      addLog("❌ No user logged in");
      return;
    }

    addLog("🧪 Testing complete background notification flow...");
    
    // Step 1: Check service worker status
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      const fcmSW = registrations.find(reg => 
        reg.scope.includes('firebase-messaging-sw') || 
        reg.active?.scriptURL.includes('firebase-messaging-sw')
      );
      
      if (!fcmSW) {
        addLog("❌ Firebase service worker not found");
        return;
      }
      
      addLog(`✅ Service worker found: ${fcmSW.active?.scriptURL}`);
      addLog(`📊 SW State: ${fcmSW.active?.state}`);
      
      // Step 2: Check if service worker can receive messages
      if (fcmSW.active) {
        addLog("🔔 Testing service worker communication...");
        fcmSW.active.postMessage({ type: 'TEST_MESSAGE', data: 'Hello from debug page' });
        
        // Listen for responses
        navigator.serviceWorker.addEventListener('message', (event) => {
          addLog(`📨 SW Response: ${JSON.stringify(event.data)}`);
        });
      }
      
      // Step 3: Send actual FCM data-only message
      addLog("🚀 Sending FCM data-only message...");
      
      const response = await fetch('/api/fcm/send-data-only', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          userType: activeRole,
          title: 'Background Test',
          body: 'Testing background notification flow',
          data: {
            type: 'message',
            category: 'test',
            priority: 'normal',
            testId: Date.now().toString(),
            notificationTitle: 'Background Test',
            notificationBody: 'Testing background notification flow'
          },
          action: {
            type: 'message',
            id: 'test_complete_flow'
          },
          priority: 'normal'
        }),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        addLog(`✅ FCM sent successfully:`);
        addLog(`   Success count: ${result.successCount}`);
        addLog(`   Failure count: ${result.failureCount}`);
        addLog(`   Failed tokens: ${JSON.stringify(result.failedTokens)}`);
        
        if (result.successCount > 0) {
          addLog("✅ FCM was delivered! Check service worker logs...");
          addLog("💡 If no service worker logs appear, the issue is SW execution");
        } else {
          addLog("❌ FCM delivery failed");
        }
      } else {
        addLog(`❌ FCM API failed: ${result.error}`);
      }
      
        } catch (error) {
      addLog(`❌ Test failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Push Notification Debug</h1>
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
            Please log in to use the debug tools.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Push Notification Debug</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-100 p-4 rounded">
            <h3 className="font-semibold">User Info</h3>
            <p>ID: {user.id}</p>
            <p>Role: {activeRole}</p>
          </div>
          
          <div className="bg-gray-100 p-4 rounded">
            <h3 className="font-semibold">Browser Info</h3>
            <p>Notification Support: {'Notification' in window ? '✅' : '❌'}</p>
            <p>SW Support: {'serviceWorker' in navigator ? '✅' : '❌'}</p>
            <p>Permission: {typeof Notification !== 'undefined' ? Notification.permission : 'Unknown'}</p>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <EnterpriseFCMTest />
          <ForceProviderFCMRegistration />
          <MultiUserFCMTest />
          
          <button
            onClick={checkPushSetup}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-2"
          >
            Run Diagnostics
          </button>
          
          <button
            onClick={testForegroundMessage}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mr-2"
          >
            Test Foreground
          </button>
          
          <button
            onClick={testBackgroundMessage}
            className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded mr-2"
          >
            Test SW Communication
          </button>
          
          <button
            onClick={testDirectNotification}
            className="bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded mr-2"
          >
            Test Direct Notification
          </button>
          
          <button
            onClick={testFCMDebug}
            className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded mr-2"
          >
            Test FCM Setup
          </button>
          
          <button
            onClick={testSimpleServiceWorker}
            className="bg-cyan-500 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded mr-2"
          >
            Test Simple SW
          </button>
          
          <button
            onClick={testSimpleFCMServiceWorker}
            className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded mr-2"
          >
            Test Simple FCM SW
          </button>
          
          <button
            onClick={sendTestNotification}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded mr-2"
          >
            Send Test Push (with notification)
          </button>
          
          <button
            onClick={sendDataOnlyNotification}
            className="bg-orange-500 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded mr-2"
          >
            Send Data-Only Push
          </button>
          
          <button
            onClick={testCompleteBackgroundFlow}
            className="bg-pink-500 hover:bg-pink-700 text-white font-bold py-2 px-4 rounded mr-2"
          >
            Test Complete Flow
          </button>
          
          <button
            onClick={clearLogs}
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
          >
            Clear Logs
          </button>
        </div>

        <div className="bg-black text-green-400 p-4 rounded font-mono text-sm h-96 overflow-y-auto">
          {logs.length === 0 ? (
            <div className="text-gray-500">Click "Run Diagnostics" to start...</div>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="mb-1">
                {log}
              </div>
            ))
          )}
        </div>

        <div className="mt-6 text-sm text-gray-600">
          <h3 className="font-semibold mb-2">Instructions:</h3>
          <ol className="list-decimal list-inside space-y-1">
            <li>Click "Run Diagnostics" to check your setup</li>
            <li>If service worker is missing, refresh the page</li>
            <li>Click "Send Test Push" to test notification delivery</li>
            <li>Check browser console and network tab for additional details</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
