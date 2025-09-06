console.log('🧪 FCM Background Notification Test');
console.log('=====================================');
console.log('');

// Simulate the issue you're experiencing
console.log('📋 Issue Analysis:');
console.log('✅ Data-only FCM message sent successfully (successCount: 1)');
console.log('❌ No background notification appears');
console.log('❌ No service worker logs in console');
console.log('');

console.log('🔍 Possible Causes:');
console.log('1. Service worker not registered properly');
console.log('2. Firebase messaging instance not initialized in SW');
console.log('3. onBackgroundMessage handler not firing');
console.log('4. FCM message format incompatible with onBackgroundMessage');
console.log('5. Browser notifications blocked or permission issues');
console.log('');

console.log('🧪 Debugging Steps:');
console.log('');

console.log('Step 1: Check Service Worker Registration');
console.log('In Safari DevTools Console, run:');
console.log('navigator.serviceWorker.getRegistrations().then(regs => console.log("SW Registrations:", regs))');
console.log('');

console.log('Step 2: Check Firebase Messaging in Service Worker');
console.log('Look for these logs in Safari Console:');
console.log('- 🚀 [SW] Firebase service worker loading...');
console.log('- 🔧 [SW] Initializing Firebase...');
console.log('- 📱 [SW] Getting messaging instance...');
console.log('- 🎯 [SW] Setting up onBackgroundMessage handler...');
console.log('- ✅ [SW] onBackgroundMessage handler registered');
console.log('');

console.log('Step 3: Test Data-Only Message Reception');
console.log('When you send data-only message, look for:');
console.log('- 🔄 [SW] Raw push event received: (means FCM reached SW)');
console.log('- 🔔 [SW] Background message received: (means onBackgroundMessage fired)');
console.log('');

console.log('Step 4: Common Issues & Solutions:');
console.log('');

console.log('Issue A: Safari-specific service worker problems');
console.log('Solution: Try in Chrome/Firefox to isolate Safari issues');
console.log('');

console.log('Issue B: Firebase SDK version incompatibility');
console.log('Solution: Service worker uses firebase-compat v10.13.0');
console.log('');

console.log('Issue C: Data-only message format');
console.log('Solution: Message has NO notification field, only data field');
console.log('');

console.log('Issue D: Push events not reaching onBackgroundMessage');
console.log('Solution: Check if raw push events are logged but onBackgroundMessage silent');
console.log('');

console.log('🎯 Next Action Items:');
console.log('1. In Safari with logged-in customer:');
console.log('   - Open DevTools → Console');
console.log('   - Refresh page to see SW initialization logs');
console.log('   - Close Safari completely');
console.log('   - Send data-only push from Chrome');
console.log('   - Reopen Safari and check console for push logs');
console.log('');
console.log('2. If no logs appear:');
console.log('   - Service worker might not be properly registered');
console.log('   - Or FCM messages not reaching the service worker');
console.log('');
console.log('3. If raw push logs appear but no onBackgroundMessage:');
console.log('   - Firebase onBackgroundMessage handler issue');
console.log('   - Message format incompatibility');

// Test if this is a browser environment
if (typeof window !== 'undefined') {
    console.log('');
    console.log('🔧 Browser Environment Detected - Running Live Tests:');
    
    // Test 1: Service Worker Registration
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
            console.log('📋 Service Worker Registrations:', registrations.length);
            registrations.forEach((reg, index) => {
                console.log(`  ${index + 1}. Scope: ${reg.scope}`);
                console.log(`     Active: ${!!reg.active}`);
                console.log(`     State: ${reg.active?.state || 'none'}`);
            });
        });
    } else {
        console.log('❌ Service Worker not supported');
    }
    
    // Test 2: Notification Permission
    if ('Notification' in window) {
        console.log(`📋 Notification Permission: ${Notification.permission}`);
    } else {
        console.log('❌ Notification API not supported');
    }
    
    // Test 3: Firebase Messaging
    setTimeout(() => {
        if (typeof firebase !== 'undefined' && firebase.messaging) {
            try {
                const messaging = firebase.messaging();
                console.log('📋 Firebase Messaging Available:', !!messaging);
            } catch (error) {
                console.log('❌ Firebase Messaging Error:', error.message);
            }
        } else {
            console.log('⚠️ Firebase not loaded in main thread (normal for SW-only setup)');
        }
    }, 1000);
}
