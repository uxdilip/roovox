// Simple FCM test without Firebase imports
console.log('🧪 SIMPLE FCM SW: Service worker loading...');
console.log('🧪 SIMPLE FCM SW: Current time:', new Date().toISOString());

self.addEventListener('install', (event) => {
    console.log('🧪 SIMPLE FCM SW: Install event');
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('🧪 SIMPLE FCM SW: Activate event');
    event.waitUntil(clients.claim());
});

self.addEventListener('push', (event) => {
    console.log('🧪 SIMPLE FCM SW: Push event received:', event);
    
    if (event.data) {
        console.log('🧪 SIMPLE FCM SW: Push data:', event.data.text());
        
        // Try to show a notification
        const notificationPromise = self.registration.showNotification('Simple FCM Test', {
            body: 'Test notification from simple service worker',
            icon: '/assets/logo.png',
            tag: 'simple-test'
        });
        
        event.waitUntil(notificationPromise);
    }
});

self.addEventListener('message', (event) => {
    console.log('🧪 SIMPLE FCM SW: Message received:', event.data);
    
    if (event.data?.type === 'TEST_MESSAGE') {
        console.log('🧪 SIMPLE FCM SW: Responding to test message');
        event.ports[0]?.postMessage({
            type: 'SIMPLE_SW_RESPONSE',
            data: { received: true, timestamp: Date.now() }
        });
    }
});

console.log('🧪 SIMPLE FCM SW: Service worker setup complete');
