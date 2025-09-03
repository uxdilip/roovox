import { useState, useEffect, useCallback, useRef } from 'react';
import { realtimeChat, getOptimizedConversations } from '@/lib/realtime-chat';
import { ChatMessage, Conversation } from '@/lib/chat-services';
import { databases, DATABASE_ID } from '@/lib/appwrite';
import { Query } from 'appwrite';

interface UseRealtimeChatProps {
  userId: string;
  userType: 'customer' | 'provider';
}

interface UseRealtimeChatReturn {
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  messages: ChatMessage[];
  loading: boolean;
  sending: boolean;
  error: string | null;
  typingUsers: Set<string>;
  onlineUsers: Set<string>;
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting'; // ✅ NEW
  
  // Actions
  setSelectedConversation: (conversation: Conversation | null) => void;
  sendMessage: (content: string) => Promise<void>;
  loadConversations: () => Promise<void>;
  clearError: () => void;
  startTyping: () => void;
  stopTyping: () => void;
}

export function useRealtimeChat({ userId, userType }: UseRealtimeChatProps): UseRealtimeChatReturn {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('connected');
  
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  // Load conversations
  const loadConversations = useCallback(async () => {
    if (!userId) return;

    try {
      // Only show loading if this is the first load and we have no conversations
      if (conversations.length === 0) {
        setLoading(true);
      }
      
      const result = await getOptimizedConversations(userId, userType);
      
      if (result.success && result.conversations) {
        setConversations(result.conversations);
      } else {
        setError(result.error || 'Failed to fetch conversations');
      }
    } catch (error) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [userId, userType, conversations.length]);

  // Subscribe to conversation updates
  useEffect(() => {
    if (!userId) return;

    const unsubscribe = realtimeChat.subscribeToConversations(
      userId,
      userType,
      (updatedConversations) => {
        setConversations(updatedConversations);
        setConnectionStatus('connected'); // Mark as connected when we receive updates
      }
    );

    // Monitor connection health - check every 60 seconds instead of 30
    const connectionMonitor = setInterval(() => {
      // Try to refresh conversations to check connectivity
      setConnectionStatus('reconnecting');
      loadConversations(); // This will trigger a refresh
      
      setTimeout(() => {
        setConnectionStatus('connected');
      }, 3000); // Give more time for the connection to establish
    }, 60000); // Check every 60 seconds for more reasonable monitoring

    return () => {
      unsubscribe();
      clearInterval(connectionMonitor);
    };
  }, [userId, userType, loadConversations]);

  // Subscribe to messages for selected conversation
  useEffect(() => {
    if (!selectedConversation) {
      setMessages([]);
      return;
    }

    // Load existing messages
    const loadMessages = async () => {
      try {
        const result = await realtimeChat.getMessages(selectedConversation.id);
        
        if (result.success && result.messages) {
          setMessages(result.messages.reverse()); // Show oldest first
        } else {
          setError(result.error || 'Failed to fetch messages');
        }
      } catch (error) {
        setError('An unexpected error occurred');
      }
    };

    loadMessages();

    // Fallback mechanism - check every 5 seconds instead of 500ms
    // This ensures messages are received even if real-time fails without being too aggressive
    const fallbackInterval = setInterval(async () => {
      try {
        const result = await realtimeChat.getMessages(selectedConversation.id);
        if (result.success && result.messages) {
          const latestMessages = result.messages.reverse();
          setMessages(prev => {
            // Only update if we have new messages and avoid excessive updates
            if (latestMessages.length > prev.length) {
              return latestMessages;
            }
            return prev;
          });
        }
      } catch (error) {
        // Silently handle fallback errors
      }
    }, 5000); // Check every 5 seconds for more reasonable fallback

    // Subscribe to new messages
    const unsubscribe = realtimeChat.subscribeToMessages(
      selectedConversation.id,
      (newMessage) => {
        setMessages(prev => {
          // Only check for exact ID duplicates (not content-based)
          const existsById = prev.some(msg => msg.id === newMessage.id);
          if (existsById) {
            return prev;
          }
          
          // Only check for optimistic message duplicates from same user
          // This prevents blocking messages from other users
          const isOptimisticDuplicate = prev.some(msg => 
            msg.id.startsWith('temp_') && 
            msg.content === newMessage.content &&
            msg.sender_id === newMessage.sender_id &&
            msg.sender_type === newMessage.sender_type &&
            Math.abs(new Date(msg.created_at).getTime() - new Date(newMessage.created_at).getTime()) < 2000 // Reduced to 2 seconds
          );
          
          if (isOptimisticDuplicate) {
            // Replace optimistic message with real message
            return prev.map(msg => 
              msg.id.startsWith('temp_') && 
              msg.content === newMessage.content &&
              msg.sender_id === newMessage.sender_id
                ? newMessage
                : msg
            );
          }
          
          return [...prev, newMessage];
        });
      }
    );

    return () => {
      unsubscribe();
      clearInterval(fallbackInterval);
    };
  }, [selectedConversation]);

  // Subscribe to typing indicators
  useEffect(() => {
    if (!selectedConversation) return;

    const unsubscribe = realtimeChat.subscribeToTyping(
      selectedConversation.id,
      ({ userId: typingUserId, isTyping }) => {
        if (typingUserId !== userId) { // Don't show our own typing
          setTypingUsers(prev => {
            const newSet = new Set(prev);
            if (isTyping) {
              newSet.add(typingUserId);
            } else {
              newSet.delete(typingUserId);
            }
            return newSet;
          });
        }
      }
    );

    return () => unsubscribe();
  }, [selectedConversation, userId]);

  // Subscribe to online status
  useEffect(() => {
    const unsubscribe = realtimeChat.subscribeToOnlineStatus(
      ({ userId: onlineUserId, isOnline }) => {
        setOnlineUsers(prev => {
          const newSet = new Set(prev);
          if (isOnline) {
            newSet.add(onlineUserId);
          } else {
            newSet.delete(onlineUserId);
          }
          return newSet;
        });
      }
    );

    return () => unsubscribe();
  }, []);

  // Send message - centralized with deduplication
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || !selectedConversation || !userId || sending) return;

    setSending(true);
    stopTyping(); // Clear typing indicator

    await realtimeChat.sendMessageOptimistic(
      selectedConversation.id,
      userId,
      userType,
      content,
      // Optimistic update
      (tempMessage) => {
        setMessages(prev => {
          // Avoid duplicate optimistic messages
          const existsById = prev.some(msg => msg.id === tempMessage.id);
          if (existsById) return prev;
          
          // Avoid duplicate by content and sender
          const existsByContent = prev.some(msg => 
            msg.content === tempMessage.content && 
            msg.sender_id === tempMessage.sender_id &&
            msg.sender_type === tempMessage.sender_type
          );
          if (existsByContent) return prev;
          
          return [...prev, tempMessage];
        });
      },
      // Success
      (realMessage) => {
        setMessages(prev => {
          // Replace temp message with real message
          const updated = prev.map(msg => 
            msg.id.startsWith('temp_') && 
            msg.content === realMessage.content &&
            msg.sender_id === realMessage.sender_id
              ? realMessage
              : msg
          );
          
          // If no temp message was replaced, check if real message already exists
          const hasRealMessage = updated.some(msg => msg.id === realMessage.id);
          if (!hasRealMessage) {
            // Add real message if it doesn't exist
            return [...updated, realMessage];
          }
          
          return updated;
        });
        setSending(false);
      },
      // Error
      (error) => {
        setMessages(prev => 
          prev.filter(msg => !msg.id.startsWith('temp_') || msg.content !== content)
        );
        setError(error);
        setSending(false);
      }
    );
  }, [selectedConversation, userId, userType, sending]);

  // Typing indicators
  const startTyping = useCallback(() => {
    if (!selectedConversation || !userId) return;

    realtimeChat.sendTypingIndicator(selectedConversation.id, userId, true);

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Auto-stop typing after 3 seconds
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 3000);
  }, [selectedConversation, userId]);

  const stopTyping = useCallback(() => {
    if (!selectedConversation || !userId) return;

    realtimeChat.sendTypingIndicator(selectedConversation.id, userId, false);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = undefined;
    }
  }, [selectedConversation, userId]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      realtimeChat.cleanup();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return {
    conversations,
    selectedConversation,
    messages,
    loading,
    sending,
    error,
    typingUsers,
    onlineUsers,
    connectionStatus, // ✅ NEW: Connection status for UI feedback
    
    setSelectedConversation,
    sendMessage,
    loadConversations,
    clearError,
    startTyping,
    stopTyping
  };
}
