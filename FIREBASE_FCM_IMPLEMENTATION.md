# 🔥 Firebase FCM Push Notifications - Implementation Guide

## 🎯 Overview

This implementation adds **Firebase Cloud Messaging (FCM)** push notifications to your Sniket project, enabling real-time notifications for both **customers** and **providers** even when the website is closed, similar to platforms like Unstop.

## ✨ Features Implemented

### 🔔 **Core Features**
- **Background Push Notifications** - Works even when browser/tab is closed
- **Cross-Platform Support** - Desktop, mobile, and tablet browsers
- **Rich Notifications** - Custom actions, images, and data
- **Smart Token Management** - Automatic registration, cleanup, and validation
- **Bi-directional Support** - Both customers and providers receive notifications

### 📱 **Notification Types**
- **Booking Notifications** - New bookings, status updates, confirmations
- **Message Notifications** - New chat messages, replies
- **Payment Notifications** - Payment success, failures, COD collection
- **System Notifications** - Important updates and alerts

### 🎨 **User Experience**
- **Permission Banner** - Friendly notification setup prompts
- **Foreground Handling** - Toast notifications when app is active
- **Click Actions** - Direct navigation to relevant pages
- **Smart Grouping** - Prevents notification spam

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Client App    │    │  Firebase FCM    │    │   Your Server   │
│                 │    │                  │    │                 │
│ • Register FCM  │◄──►│ • Push Messages  │◄──►│ • Trigger Push  │
│ • Handle Push   │    │ • Delivery       │    │ • Send to FCM   │
│ • Show Notif    │    │ • Token Mgmt     │    │ • Store Tokens  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 📂 Files Added/Modified

### **New Files Created:**

#### **🔥 Firebase Configuration**
- `/lib/firebase/config.ts` - Client-side Firebase setup
- `/lib/firebase/admin.ts` - Server-side Firebase Admin SDK
- `/lib/firebase/messaging.ts` - FCM token registration and messaging
- `/lib/firebase/push-service.ts` - Push notification sending service

#### **💾 FCM Token Management**
- `/lib/services/fcm-token-service.ts` - Appwrite token CRUD operations
- `/app/api/fcm/register/route.ts` - Token registration API
- `/app/api/fcm/unregister/route.ts` - Token cleanup API
- `/app/api/fcm/send-notification/route.ts` - Push sending API

#### **🎨 UI Components**
- `/components/notifications/NotificationPermissionBanner.tsx` - Permission UI
- `/hooks/use-fcm.ts` - React hook for FCM management

#### **🔧 Service Worker**
- `/public/firebase-messaging-sw.js` - Background notification handler

### **Modified Files:**

#### **🔧 Configuration**
- `/.env.local` - Added Firebase environment variables
- `/lib/appwrite.ts` - Added FCM_TOKENS collection
- `/next.config.js` - Added service worker headers
- `/public/manifest.json` - Enhanced for PWA support

#### **📱 Layout Integration**
- `/app/(customer)/layout.tsx` - Added FCM for customers
- `/app/(provider)/layout.tsx` - Added FCM for providers

#### **🔔 Notification System**
- `/lib/notifications.ts` - Enhanced with push notification integration

## 🚀 How It Works

### **1. User Registration Flow**
```typescript
1. User visits site → useFCM hook activates
2. Permission banner shows → User clicks "Enable Notifications"
3. Browser requests permission → User grants permission
4. Service worker registers → FCM token generated
5. Token saved to Appwrite → User ready for notifications
```

### **2. Notification Sending Flow**
```typescript
1. Event occurs (booking, message, etc.) → Notification service triggered
2. In-app notification created → Push notification queued (async)
3. FCM tokens retrieved → Firebase Admin SDK sends push
4. Invalid tokens cleaned → Delivery results logged
```

### **3. Notification Delivery**
```typescript
// When app is OPEN (foreground)
Message received → useFCM hook → Toast notification shown

// When app is CLOSED (background)
Message received → Service worker → System notification shown
```

## 🔧 Configuration

### **Environment Variables Added:**
```bash
# Firebase Client Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCF_hn_33xTJaO-zwXGNxhVc9yJqjXfXD0
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=sniket-d2766.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=sniket-d2766
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=sniket-d2766.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=968429297305
NEXT_PUBLIC_FIREBASE_APP_ID=1:968429297305:web:7425601aff7e7d08b52208
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-V3D17BJYZ9
NEXT_PUBLIC_FIREBASE_VAPID_KEY=BPvZrQ45V7X76Nne0Rg8NPT6qZddSBuBIyiUMz5kWbESCsjFscomEmC5cs2StnCdSpu8Y5AKnyrpDwKEqvSOnz0

# Firebase Admin Configuration (Server-side only)
FIREBASE_ADMIN_PROJECT_ID=sniket-d2766
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-fbsvc@sniket-d2766.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
```

### **Appwrite Database:**
- **Collection:** `fcm_tokens`
- **Attributes:** `user_id`, `user_type`, `token`, `device_info`, `is_active`, `created_at`, `updated_at`

## 🎯 Usage Examples

### **For Customers:**
```typescript
// Automatic registration when customer logs in
const { isRegistered, register } = useFCM({
  userId: customer.id,
  userType: 'customer'
});

// Notifications triggered on:
- New booking confirmation
- Booking status updates
- Provider messages
- Payment confirmations
```

### **For Providers:**
```typescript
// Automatic registration when provider logs in
const { isRegistered, register } = useFCM({
  userId: provider.id,
  userType: 'provider'
});

// Notifications triggered on:
- New booking requests
- Customer messages
- Payment notifications
- System alerts
```

### **Manual Push Sending:**
```typescript
// Send to specific user
await fetch('/api/fcm/send-notification', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'user123',
    userType: 'customer',
    title: 'Booking Confirmed!',
    body: 'Your repair service has been confirmed',
    action: { type: 'booking', id: 'booking123' },
    priority: 'high'
  })
});

// Send to multiple users
await fetch('/api/fcm/send-notification', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    users: [
      { userId: 'user1', userType: 'customer' },
      { userId: 'user2', userType: 'provider' }
    ],
    title: 'System Maintenance',
    body: 'Scheduled maintenance in 30 minutes',
    priority: 'normal'
  })
});
```

## 🔍 Testing

### **Test Scenarios:**

1. **Permission Flow:**
   - Visit site as customer/provider
   - Check if permission banner appears
   - Click "Enable Notifications"
   - Verify browser permission prompt
   - Check if token is saved in Appwrite

2. **Foreground Notifications:**
   - Keep site open
   - Trigger notification (create booking, send message)
   - Verify toast notification appears

3. **Background Notifications:**
   - Close browser tab/window
   - Trigger notification from another device/admin
   - Verify system notification appears
   - Click notification to verify page opens

4. **Cross-User Testing:**
   - Customer creates booking → Provider gets notification
   - Provider updates status → Customer gets notification
   - Either sends message → Other gets notification

## 🛠️ Debugging

### **Common Issues:**

1. **No Permission Banner:**
   - Check if user is logged in
   - Verify userId and userType are available
   - Check browser console for errors

2. **Permission Denied:**
   - User declined browser permission
   - Clear site data and try again
   - Check if HTTPS is enabled (required for FCM)

3. **No Background Notifications:**
   - Check if service worker is registered
   - Verify Firebase config in service worker
   - Check browser developer tools → Application → Service Workers

4. **Token Registration Fails:**
   - Check Firebase project settings
   - Verify VAPID key is correct
   - Check network requests in browser dev tools

### **Debug Commands:**
```bash
# Check service worker status
console.log(await navigator.serviceWorker.getRegistrations());

# Check notification permission
console.log(Notification.permission);

# Test FCM token generation
import { registerFCMToken } from '@/lib/firebase/messaging';
const result = await registerFCMToken('test-user', 'customer');
console.log(result);
```

## 📊 Analytics & Monitoring

- **Token Registration Success Rate** - Track in Appwrite
- **Notification Delivery Rate** - Firebase Console
- **Click-Through Rate** - Custom analytics in service worker
- **Permission Grant Rate** - Track user interactions

## 🔐 Security Features

- **Token Validation** - Automatic cleanup of invalid tokens
- **Rate Limiting** - Built into Firebase FCM
- **Secure Storage** - Tokens stored securely in Appwrite
- **User Privacy** - Only sends to authorized users

## 🚀 Next Steps

1. **Enhanced Rich Notifications** - Add images and advanced actions
2. **Notification Scheduling** - Schedule future notifications
3. **Analytics Dashboard** - Track notification performance
4. **A/B Testing** - Test different notification styles
5. **Multi-language Support** - Localized notifications

## 🎉 Success!

Your Sniket platform now has enterprise-grade push notifications that work just like Unstop and other modern platforms! Customers and providers will receive timely notifications for bookings, messages, and important updates even when the site is closed.

The implementation is production-ready, scalable, and follows modern Firebase FCM best practices.
