import { useState } from 'react';

export default function ForceProviderFCMRegistration() {
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const forceRegisterProvider = async () => {
    setIsLoading(true);
    setStatus('Starting registration...');

    try {
      // Import Firebase
      const { getMessaging, getToken } = await import('firebase/messaging');
      const { initializeApp, getApps } = await import('firebase/app');

      const firebaseConfig = {
        apiKey: "AIzaSyCF_hn_33xTJaO-zwXGNxhVc9yJqjXfXD0",
        authDomain: "sniket-d2766.firebaseapp.com",
        projectId: "sniket-d2766",
        storageBucket: "sniket-d2766.firebasestorage.app",
        messagingSenderId: "968429297305",
        appId: "1:968429297305:web:7425601aff7e7d08b52208",
        measurementId: "G-V3D17BJYZ9"
      };

      // Initialize Firebase
      const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
      const messaging = getMessaging(app);

      setStatus('Requesting permission...');
      const permission = await Notification.requestPermission();
      
      if (permission !== 'granted') {
        setStatus('Permission denied');
        return;
      }

      setStatus('Getting FCM token...');
      const token = await getToken(messaging, {
        vapidKey: 'BCwWhlGnUY4lMF6KUvHHVKO8E-lRcP_7hn0djQ5oE9_rAFVFMC-hhV1mRt6SL8o_8I8vlZSWt0XOHNZoJJPaOcs'
      });

      setStatus('Registering token...');
      
      // Clear any existing cached tokens
      localStorage.removeItem('fcm_token_6877cf2d001d10de08ec_customer');
      localStorage.removeItem('fcm_token_6877cf2d001d10de08ec_provider');
      
      // Register with server
      const response = await fetch('/api/fcm/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: '6877cf2d001d10de08ec',
          userType: 'provider',
          token: token
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setStatus('✅ Provider FCM registered successfully!');
        localStorage.setItem('fcm_token_6877cf2d001d10de08ec_provider', token);
      } else {
        setStatus('❌ Registration failed: ' + result.error);
      }

    } catch (error) {
      setStatus('❌ Error: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded">
      <h3 className="font-bold mb-2">Provider FCM Fix</h3>
      <p className="text-sm mb-4">
        Force register the provider for FCM notifications
      </p>
      <button 
        onClick={forceRegisterProvider}
        disabled={isLoading}
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {isLoading ? 'Registering...' : 'Force Register Provider FCM'}
      </button>
      <div className="mt-2 text-sm">
        Status: {status}
      </div>
    </div>
  );
}
