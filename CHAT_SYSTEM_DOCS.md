# Chat System Documentation

## Overview
The chat system in this application provides real-time messaging between customers and providers using Appwrite as the backend.

## Key Components

### 1. Main Chat Pages
- `app/(customer)/chat/page.tsx` - Main chat interface with offer management
- `app/(customer)/chat/realtime-page.tsx` - Alternative realtime chat interface

### 2. Core Services
- `lib/realtime-chat.ts` - Real-time chat service handling subscriptions and message sending
- `hooks/use-realtime-chat.ts` - React hook providing chat functionality
- `contexts/ChatContext.tsx` - Context for managing active chat sessions

## Recent Fixes Applied

### 1. React Hooks Dependencies
- Fixed missing dependencies in `useEffect` hooks
- Made `loadConversations` and `loadMessages` stable with `useCallback`
- Added proper dependency arrays to prevent stale closures

### 2. Performance Optimizations
- Reduced aggressive polling from 500ms to 5 seconds
- Improved connection monitoring from 30s to 60s intervals
- Better error handling with specific connection error messages

### 3. Typing Indicators
- Improved error handling in typing indicator implementation
- Added documentation for future cross-user typing implementation
- Currently works within browser session, needs enhancement for cross-user functionality

### 4. Message Deduplication
- Simplified optimistic update logic
- Better handling of temporary vs real messages
- Reduced time window for duplicate detection to 2 seconds

## Known Limitations

### 1. Typing Indicators
- Currently only work within the same browser session
- Need enhancement for real cross-user typing indicators
- Suggested solutions:
  - Use Appwrite real-time channels with custom events
  - Implement dedicated typing_indicators collection with TTL
  - Use WebSocket channels for ephemeral data

### 2. Connection Handling
- Better offline/online detection needed
- Consider implementing exponential backoff for reconnection attempts
- Add visual indicators for connection status

## Environment Setup

### Required Environment Variables
```env
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
NEXT_PUBLIC_APPWRITE_DATABASE_ID=your_database_id
NEXT_PUBLIC_APPWRITE_MESSAGES_COLLECTION_ID=messages
```

### Collections Required
- `conversations` - Store chat conversations
- `messages` - Store chat messages
- `User` or `customers`/`providers` - User profiles

## Testing

### Manual Testing Checklist
1. ✅ Chat page loads without errors
2. ✅ No React hooks warnings in console
3. ✅ Proper error handling when Appwrite is unavailable
4. ✅ UI components render correctly
5. ⏳ Message sending (requires authenticated user)
6. ⏳ Real-time message receiving (requires active Appwrite connection)
7. ⏳ Typing indicators (limited to same session)

### Future Enhancements
1. Add comprehensive unit tests for chat hooks
2. Add integration tests for message flow
3. Implement better connection state management
4. Add message persistence for offline scenarios
5. Implement proper cross-user typing indicators