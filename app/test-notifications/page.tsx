'use client';

import { useState } from 'react';

export default function TestNotifications() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const sendTestNotification = async (type: string) => {
    setLoading(true);
    setResult(null);

    try {
      const testData = getTestData(type);
      
      const response = await fetch('/api/fcm/send-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData)
      });

      const result = await response.json();
      setResult(result);
      
      if (result.success) {
        console.log('✅ Test notification sent successfully');
      } else {
        console.error('❌ Test notification failed:', result.error);
      }

    } catch (error) {
      console.error('❌ Error sending test notification:', error);
      setResult({ error: 'Failed to send notification' });
    } finally {
      setLoading(false);
    }
  };

  const getTestData = (type: string) => {
    const baseData = {
      userId: 'test-user-123',
      userType: 'customer',
      priority: 'high'
    };

    switch (type) {
      case 'enhanced_message':
        return {
          ...baseData,
          data: {
            type: 'message',
            senderName: 'John the Technician',
            messageContent: 'Your device repair is complete! Please come pick it up at your earliest convenience.',
            conversationId: 'conv_123',
            relatedId: 'conv_123',
            userId: 'test-user-123',
            userType: 'customer',
            clickAction: '/chat/conv_123',
            notificationIcon: '/assets/chat-icon.png',
            notificationBadge: '/assets/badge.png',
            priority: 'high',
            timestamp: new Date().toISOString()
          },
          action: {
            type: 'message',
            id: 'conv_123'
          }
        };

      case 'booking_update':
        return {
          ...baseData,
          data: {
            type: 'booking',
            bookingStatus: 'confirmed',
            relatedId: 'booking_456',
            userId: 'test-user-123',
            userType: 'customer',
            clickAction: '/booking/booking_456',
            notificationIcon: '/assets/booking-icon.png',
            priority: 'high',
            timestamp: new Date().toISOString()
          },
          action: {
            type: 'booking',
            id: 'booking_456'
          }
        };

      case 'payment_success':
        return {
          ...baseData,
          data: {
            type: 'payment',
            amount: '1200',
            relatedId: 'payment_789',
            userId: 'test-user-123',
            userType: 'customer',
            clickAction: '/payments',
            notificationIcon: '/assets/payment-icon.png',
            priority: 'high',
            timestamp: new Date().toISOString()
          },
          action: {
            type: 'payment',
            id: 'payment_789'
          }
        };

      case 'quote_request':
        return {
          ...baseData,
          userType: 'provider',
          data: {
            type: 'quote_request',
            deviceType: 'iPhone 14 Pro',
            relatedId: 'quote_321',
            userId: 'test-provider-456',
            userType: 'provider',
            clickAction: '/quotes/quote_321',
            notificationIcon: '/assets/quote-icon.png',
            priority: 'high',
            timestamp: new Date().toISOString()
          },
          action: {
            type: 'quote_request',
            id: 'quote_321'
          }
        };

      default:
        return {
          ...baseData,
          title: 'Old Style Notification',
          body: 'This is an old style notification with localhost:3000',
          data: {
            type: 'system',
            timestamp: new Date().toISOString()
          }
        };
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Notification Enhancement Testing
          </h1>

          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-blue-900 mb-3">
                Enhanced Notifications (New Style)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                  onClick={() => sendTestNotification('enhanced_message')}
                  disabled={loading}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Enhanced Message
                </button>
                
                <button
                  onClick={() => sendTestNotification('booking_update')}
                  disabled={loading}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  Booking Update
                </button>
                
                <button
                  onClick={() => sendTestNotification('payment_success')}
                  disabled={loading}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  Payment Success
                </button>
                
                <button
                  onClick={() => sendTestNotification('quote_request')}
                  disabled={loading}
                  className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 disabled:opacity-50"
                >
                  Quote Request
                </button>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-red-900 mb-3">
                Old Style Notification (For Comparison)
              </h2>
              <button
                onClick={() => sendTestNotification('old_style')}
                disabled={loading}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                Old Style (localhost:3000)
              </button>
            </div>
          </div>

          {loading && (
            <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800">Sending notification...</p>
            </div>
          )}

          {result && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Test Result:</h3>
              <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}

          <div className="mt-8 bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3">What's Enhanced:</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>✅ <strong>App Name:</strong> Shows "Sniket" instead of "localhost:3000"</li>
              <li>✅ <strong>Rich Titles:</strong> Context-aware titles without emojis</li>
              <li>✅ <strong>Smart Content:</strong> Message content preview, status updates</li>
              <li>✅ <strong>Action Buttons:</strong> Reply, View, etc. based on notification type</li>
              <li>✅ <strong>Custom Icons:</strong> Different icons for each notification type</li>
              <li>✅ <strong>Vibration Patterns:</strong> Unique patterns for different types</li>
              <li>✅ <strong>Smart Routing:</strong> Direct links to relevant pages</li>
            </ul>
          </div>

          <div className="mt-6 bg-orange-50 border border-orange-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-orange-900 mb-2">Testing Instructions:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-orange-800">
              <li>Make sure you have FCM tokens registered</li>
              <li>Click any enhanced notification button above</li>
              <li>Check your device/browser for the notification</li>
              <li>Compare with old style notification</li>
              <li>Notice the improved branding and content</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
