// Simple test service worker to check if JS is executing
console.log('🧪 TEST SW: Service worker JavaScript is executing!');
console.log('🧪 TEST SW: Current time:', new Date().toISOString());

self.addEventListener('install', () => {
    console.log('🧪 TEST SW: Install event fired');
});

self.addEventListener('activate', () => {
    console.log('🧪 TEST SW: Activate event fired');
});

self.addEventListener('message', (event) => {
    console.log('🧪 TEST SW: Message received:', event.data);
});
