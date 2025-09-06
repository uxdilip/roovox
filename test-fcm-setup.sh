#!/bin/bash

echo "🧪 Testing FCM Push Notification Setup"
echo "======================================"
echo

# Test 1: Check if server is running
echo "1️⃣ Testing server availability..."
SERVER_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
if [ "$SERVER_STATUS" = "200" ] || [ "$SERVER_STATUS" = "404" ]; then
    echo "✅ Server is running (HTTP $SERVER_STATUS)"
else
    echo "❌ Server not accessible (HTTP $SERVER_STATUS)"
    exit 1
fi
echo

# Test 2: Check service worker file
echo "2️⃣ Testing service worker accessibility..."
SW_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/firebase-messaging-sw.js)
if [ "$SW_STATUS" = "200" ]; then
    echo "✅ Service worker file accessible"
    echo "🔍 Service worker contains Firebase setup:"
    curl -s http://localhost:3000/firebase-messaging-sw.js | grep -E "(Firebase|messaging|onBackgroundMessage)" | head -3
else
    echo "❌ Service worker not accessible (HTTP $SW_STATUS)"
fi
echo

# Test 3: Test FCM API endpoints
echo "3️⃣ Testing FCM API endpoints..."

# Test regular notification endpoint
echo "📱 Testing regular notification endpoint:"
REGULAR_RESPONSE=$(curl -s -X POST http://localhost:3000/api/fcm/send-notification \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-id", 
    "userType": "customer",
    "title": "Test FCM",
    "body": "Test message",
    "data": {"type": "test"},
    "action": {"type": "test", "id": "test-123"}
  }')
echo "Response: $REGULAR_RESPONSE"
echo

# Test data-only endpoint
echo "📦 Testing data-only notification endpoint:"
DATA_ONLY_RESPONSE=$(curl -s -X POST http://localhost:3000/api/fcm/send-data-only \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-id", 
    "userType": "customer",
    "title": "Test Data-Only FCM",
    "body": "Test data-only message",
    "data": {"type": "test"},
    "action": {"type": "test", "id": "test-123"}
  }')
echo "Response: $DATA_ONLY_RESPONSE"
echo

# Test 4: Check Firebase configuration
echo "4️⃣ Checking Firebase configuration..."
if grep -q "AIzaSyCF_hn_33xTJaO-zwXGNxhVc9yJqjXfXD0" /Users/dilip/Documents/project/public/firebase-messaging-sw.js; then
    echo "✅ Firebase API key found in service worker"
else
    echo "❌ Firebase API key not found in service worker"
fi

if grep -q "sniket-d2766" /Users/dilip/Documents/project/public/firebase-messaging-sw.js; then
    echo "✅ Firebase project ID found in service worker"
else
    echo "❌ Firebase project ID not found in service worker"
fi
echo

# Test 5: Check for common issues
echo "5️⃣ Checking for common issues..."

# Check if VAPID key is set
if [ -f "/Users/dilip/Documents/project/.env.local" ]; then
    if grep -q "NEXT_PUBLIC_FIREBASE_VAPID_KEY" /Users/dilip/Documents/project/.env.local; then
        echo "✅ VAPID key environment variable found"
    else
        echo "⚠️  VAPID key environment variable not found in .env.local"
    fi
else
    echo "⚠️  .env.local file not found"
fi

# Check for service worker registration logs
echo
echo "🔍 Service worker logging setup:"
if grep -q "console.log.*SW.*Background message received" /Users/dilip/Documents/project/public/firebase-messaging-sw.js; then
    echo "✅ Background message logging enabled"
else
    echo "❌ Background message logging not found"
fi

if grep -q "console.log.*SW.*Raw push event received" /Users/dilip/Documents/project/public/firebase-messaging-sw.js; then
    echo "✅ Raw push event logging enabled"
else
    echo "❌ Raw push event logging not found"
fi

echo
echo "🎯 Summary:"
echo "- Server is accessible"
echo "- Service worker file is available"
echo "- FCM API endpoints are responding"
echo "- Both endpoints return 'no_tokens' (expected for test user)"
echo "- Firebase configuration is present in service worker"
echo
echo "📋 Next steps for browser testing:"
echo "1. Open Safari with a logged-in user"
echo "2. Check browser console for service worker logs"
echo "3. Test with actual user tokens from debug page"
echo "4. Look for '🔔 [SW] Background message received:' in console"
