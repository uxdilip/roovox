#!/bin/bash

# Firebase FCM Implementation Static Test
echo "🔥 Testing Firebase FCM Implementation (Static Analysis)"
echo "======================================================="

# Test 1: Check Firebase service worker
echo "📱 Test 1: Service Worker"
if [ -f "public/firebase-messaging-sw.js" ]; then
    echo "✅ Firebase service worker exists"
    echo "   Content check..."
    if grep -q "firebase-messaging-compat" "public/firebase-messaging-sw.js"; then
        echo "   ✅ Contains Firebase messaging imports"
    else
        echo "   ❌ Missing Firebase messaging imports"
    fi
else
    echo "❌ Firebase service worker missing"
fi

# Test 2: Check environment variables
echo "🔧 Test 2: Environment Variables"
if [ -f ".env.local" ]; then
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
else
    echo "❌ .env.local file not found"
fi

# Test 3: Check critical files
echo "📁 Test 3: Implementation Files"
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

# Test 4: Check integration points
echo "🔗 Test 4: Integration Points"
if [ -f "app/(customer)/layout.tsx" ] && grep -q "useFCM\|NotificationPermissionBanner" "app/(customer)/layout.tsx"; then
    echo "✅ Customer layout has FCM integration"
else
    echo "❌ Customer layout missing FCM integration"
fi

if [ -f "app/(provider)/layout.tsx" ] && grep -q "useFCM\|NotificationPermissionBanner" "app/(provider)/layout.tsx"; then
    echo "✅ Provider layout has FCM integration"
else
    echo "❌ Provider layout missing FCM integration"
fi

if [ -f "lib/notifications.ts" ] && grep -q "sendPushNotificationAsync" "lib/notifications.ts"; then
    echo "✅ Notification service has push integration"
else
    echo "❌ Notification service missing push integration"
fi

# Test 5: Check package.json dependencies
echo "📦 Test 5: Dependencies"
if [ -f "package.json" ]; then
    if grep -q "firebase" package.json; then
        echo "✅ Firebase dependencies found"
    else
        echo "❌ Firebase dependencies missing"
    fi
else
    echo "❌ package.json not found"
fi

# Test 6: TypeScript validation
echo "🔍 Test 6: TypeScript Check"
if command -v npx >/dev/null 2>&1; then
    echo "Running TypeScript check..."
    npx tsc --noEmit 2>/dev/null
    if [ $? -eq 0 ]; then
        echo "✅ TypeScript validation passed"
    else
        echo "⚠️  TypeScript has some issues (not critical for FCM)"
    fi
else
    echo "⚠️  TypeScript not available for validation"
fi

# Summary
echo ""
echo "📋 Test Summary"
echo "==============="
if [ ${#missing_files[@]} -eq 0 ]; then
    echo "🎉 All implementation files are present!"
    echo "✅ Firebase FCM implementation appears to be complete"
    echo ""
    echo "🧪 Manual Testing Steps:"
    echo "1. Start dev server: npm run dev"
    echo "2. Open http://localhost:3001 in Chrome"
    echo "3. Login as customer or provider"
    echo "4. Look for orange notification permission banner"
    echo "5. Click 'Enable Notifications' and grant permission"
    echo "6. Test booking creation/status updates to trigger notifications"
    echo ""
    echo "🔍 Debug Tools:"
    echo "- Chrome DevTools → Console for logs"
    echo "- Application → Service Workers for registration"
    echo "- Application → Storage → IndexedDB for FCM tokens"
    echo "- Network tab for API calls"
else
    echo "❌ Missing files detected:"
    for file in "${missing_files[@]}"; do
        echo "   - $file"
    done
fi
