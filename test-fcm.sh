#!/bin/bash

# Firebase FCM Implementation Test Script
echo "🔥 Testing Firebase FCM Implementation"
echo "======================================"

# Test 1: Check if server is running
echo "📡 Test 1: Server Status"
if curl -s http://localhost:3001 >/dev/null; then
    echo "✅ Server is running on http://localhost:3001"
else
    echo "❌ Server is not accessible"
    exit 1
fi

# Test 2: Check Firebase service worker
echo "📱 Test 2: Service Worker"
if [ -f "public/firebase-messaging-sw.js" ]; then
    echo "✅ Firebase service worker exists"
else
    echo "❌ Firebase service worker missing"
fi

# Test 3: Check FCM API endpoints
echo "🔗 Test 3: API Endpoints"
response=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3001/api/fcm/register \
  -H "Content-Type: application/json" \
  -d '{}')

if [ "$response" = "400" ]; then
    echo "✅ FCM register endpoint is responding (400 for missing data is expected)"
else
    echo "⚠️  FCM register endpoint response: $response"
fi

# Test 4: Check environment variables
echo "🔧 Test 4: Environment Variables"
if grep -q "NEXT_PUBLIC_FIREBASE_API_KEY" .env.local; then
    echo "✅ Firebase client config found"
else
    echo "❌ Firebase client config missing"
fi

if grep -q "FIREBASE_ADMIN_PROJECT_ID" .env.local; then
    echo "✅ Firebase admin config found"
else
    echo "❌ Firebase admin config missing"
fi

# Test 5: Check critical files
echo "📁 Test 5: Implementation Files"
files=(
    "lib/firebase/config.ts"
    "lib/firebase/admin.ts"
    "lib/firebase/messaging.ts"
    "lib/firebase/push-service.ts"
    "lib/services/fcm-token-service.ts"
    "hooks/use-fcm.ts"
    "components/notifications/NotificationPermissionBanner.tsx"
    "app/api/fcm/register/route.ts"
    "app/api/fcm/unregister/route.ts"
)

missing_files=()
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file"
        missing_files+=("$file")
    fi
done

# Test 6: Check integration points
echo "🔗 Test 6: Integration Points"
if grep -q "useFCM" "app/(customer)/layout.tsx"; then
    echo "✅ Customer layout has FCM integration"
else
    echo "❌ Customer layout missing FCM integration"
fi

if grep -q "useFCM" "app/(provider)/layout.tsx"; then
    echo "✅ Provider layout has FCM integration"
else
    echo "❌ Provider layout missing FCM integration"
fi

if grep -q "sendPushNotificationAsync" "lib/notifications.ts"; then
    echo "✅ Notification service has push integration"
else
    echo "❌ Notification service missing push integration"
fi

# Summary
echo ""
echo "📋 Test Summary"
echo "==============="
if [ ${#missing_files[@]} -eq 0 ]; then
    echo "🎉 All implementation files are present!"
    echo "✅ Firebase FCM implementation appears to be complete"
    echo ""
    echo "🧪 Next Steps for Manual Testing:"
    echo "1. Open http://localhost:3001 in Chrome"
    echo "2. Login as customer or provider"
    echo "3. Look for orange notification permission banner"
    echo "4. Click 'Enable Notifications' and grant permission"
    echo "5. Test booking creation/status updates to trigger notifications"
    echo ""
    echo "🔍 Debug Tools:"
    echo "- Open Chrome DevTools → Console for logs"
    echo "- Check Application → Service Workers for registration"
    echo "- Monitor Network tab for API calls"
else
    echo "❌ Missing files detected:"
    for file in "${missing_files[@]}"; do
        echo "   - $file"
    done
fi
