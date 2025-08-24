"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { realtimeChat, getOptimizedConversations } from '@/lib/realtime-chat';
import { databases, DATABASE_ID } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  MessageCircle, 
  Send, 
  Search,
  Clock,
  Smartphone,
  Laptop,
  Check,
  CheckCheck,
  MoreVertical
} from 'lucide-react';
import { ChatMessage, Conversation } from '@/lib/chat-services';

export default function RealtimeChatPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [providerProfiles, setProviderProfiles] = useState<Record<string, any>>({});
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const messageInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Fetch provider profile (cached)
  const fetchProviderProfile = useCallback(async (providerId: string) => {
    if (providerProfiles[providerId]) return providerProfiles[providerId];

    try {
      const userRes = await databases.listDocuments(
        DATABASE_ID,
        'User',
        [Query.equal('user_id', providerId), Query.limit(1)]
      );

      if (userRes.documents.length > 0) {
        const user = userRes.documents[0];
        
        const businessRes = await databases.listDocuments(
          DATABASE_ID,
          'business_setup',
          [Query.equal('user_id', providerId), Query.limit(1)]
        );

        let businessName = user.name;
        if (businessRes.documents.length > 0) {
          const businessSetup = businessRes.documents[0];
          try {
            if (businessSetup.onboarding_data) {
              const onboardingData = JSON.parse(businessSetup.onboarding_data);
              businessName = onboardingData?.businessInfo?.businessName || user.name;
            }
          } catch (e) {
            // Ignore parsing errors
          }
        }

        const profile = {
          id: providerId,
          name: user.name,
          businessName: businessName,
          email: user.email,
          phone: user.phone,
          profilePicture: user.profilePicture
        };

        setProviderProfiles(prev => ({ ...prev, [providerId]: profile }));
        return profile;
      }

      return null;
    } catch (error) {
      console.error('Error fetching provider profile:', error);
      return null;
    }
  }, [providerProfiles]);

  // Load conversations on mount
  useEffect(() => {
    if (user?.id) {
      loadConversations();
    }
  }, [user?.id]);

  // Subscribe to real-time conversation updates
  useEffect(() => {
    if (!user?.id) return;

    const unsubscribe = realtimeChat.subscribeToConversations(
      user.id,
      'customer',
      (updatedConversations) => {
        setConversations(updatedConversations);
        
        // Fetch provider profiles for new conversations
        updatedConversations.forEach(conv => {
          if (!providerProfiles[conv.provider_id]) {
            fetchProviderProfile(conv.provider_id);
          }
        });
      }
    );

    return () => unsubscribe();
  }, [user?.id, fetchProviderProfile, providerProfiles]);

  // Subscribe to messages for selected conversation
  useEffect(() => {
    if (!selectedConversation) return;

    // Load existing messages
    loadMessages(selectedConversation.id);

    // Subscribe to new messages
    const unsubscribe = realtimeChat.subscribeToMessages(
      selectedConversation.id,
      (newMessage) => {
        setMessages(prev => {
          // Avoid duplicates
          const exists = prev.some(msg => msg.id === newMessage.id);
          if (exists) return prev;
          
          return [...prev, newMessage];
        });
        
        // Scroll to bottom for new messages
        setTimeout(scrollToBottom, 100);
      }
    );

    return () => unsubscribe();
  }, [selectedConversation, scrollToBottom]);

  // Subscribe to typing indicators
  useEffect(() => {
    if (!selectedConversation) return;

    const unsubscribe = realtimeChat.subscribeToTyping(
      selectedConversation.id,
      ({ userId, isTyping }) => {
        if (userId !== user?.id) { // Don't show our own typing
          setTypingUsers(prev => {
            const newSet = new Set(prev);
            if (isTyping) {
              newSet.add(userId);
            } else {
              newSet.delete(userId);
            }
            return newSet;
          });
        }
      }
    );

    return () => unsubscribe();
  }, [selectedConversation, user?.id]);

  // Load conversations
  const loadConversations = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const result = await getOptimizedConversations(user.id, 'customer');
      
      if (result.success && result.conversations) {
        setConversations(result.conversations);
        
        // Fetch provider profiles
        const providerIds = Array.from(new Set(result.conversations.map(conv => conv.provider_id)));
        for (const providerId of providerIds) {
          fetchProviderProfile(providerId);
        }
      } else {
        setError(result.error || 'Failed to fetch conversations');
      }
    } catch (error) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Load messages for a conversation
  const loadMessages = async (conversationId: string) => {
    try {
      const result = await realtimeChat.getMessages(conversationId);
      
      if (result.success && result.messages) {
        setMessages(result.messages.reverse()); // Reverse to show oldest first
        setTimeout(scrollToBottom, 100);
      } else {
        setError(result.error || 'Failed to fetch messages');
      }
    } catch (error) {
      setError('An unexpected error occurred');
    }
  };

  // Send message with optimistic updates
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user?.id || sending) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setSending(true);

    // Clear typing indicator
    handleTyping(false);

    await realtimeChat.sendMessageOptimistic(
      selectedConversation.id,
      user.id,
      'customer',
      messageText,
      // Optimistic update - show immediately
      (tempMessage) => {
        setMessages(prev => [...prev, tempMessage]);
        setTimeout(scrollToBottom, 50);
      },
      // Success - replace temp message with real one
      (realMessage) => {
        setMessages(prev => 
          prev.map(msg => 
            msg.id.startsWith('temp_') && msg.content === realMessage.content
              ? realMessage
              : msg
          )
        );
        setSending(false);
      },
      // Error - remove temp message and show error
      (error) => {
        setMessages(prev => 
          prev.filter(msg => !msg.id.startsWith('temp_') || msg.content !== messageText)
        );
        setError(error);
        setSending(false);
        setNewMessage(messageText); // Restore message for retry
      }
    );
  };

  // Handle typing indicators
  const handleTyping = (isTyping: boolean) => {
    if (!selectedConversation || !user?.id) return;

    realtimeChat.sendTypingIndicator(selectedConversation.id, user.id, isTyping);
  };

  // Handle input changes with typing indicators
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);

    // Send typing indicator
    if (e.target.value.trim() && !typingTimeoutRef.current) {
      handleTyping(true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      handleTyping(false);
      typingTimeoutRef.current = undefined;
    }, 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Filter conversations
  const filteredConversations = conversations.filter(conv => {
    const provider = providerProfiles[conv.provider_id];
    if (!provider) return true;
    
    return provider.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
           provider.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Time formatting
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${Math.floor(diffInHours)} hours ago`;
    if (diffInHours < 48) return 'Yesterday';
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)} days ago`;
    if (diffInHours < 672) return `${Math.floor(diffInHours / 168)} weeks ago`;
    return `${Math.floor(diffInHours / 672)} months ago`;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      realtimeChat.cleanup();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar - Conversations List */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-lg font-semibold text-gray-900 flex items-center">
            All messages
            {loading && <div className="ml-2 w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>}
          </h1>
          <div className="mt-3 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <MessageCircle className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              {searchQuery ? 'No conversations found' : 'No conversations yet'}
            </div>
          ) : (
            filteredConversations.map((conversation) => {
              const provider = providerProfiles[conversation.provider_id];
              const isSelected = selectedConversation?.id === conversation.id;
              
              return (
                <div
                  key={conversation.id}
                  onClick={() => setSelectedConversation(conversation)}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                    isSelected ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={provider?.profilePicture} />
                        <AvatarFallback className="bg-green-100 text-green-600">
                          {provider?.businessName?.charAt(0)?.toUpperCase() || provider?.name?.charAt(0)?.toUpperCase() || 'P'}
                        </AvatarFallback>
                      </Avatar>
                      {onlineUsers.has(conversation.provider_id) && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900 truncate">
                          {provider?.businessName || provider?.name || 'Service Provider'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatTime(conversation.last_message_at)}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-600 mt-1 line-clamp-1">
                        {conversation.last_message_content ? (
                          <span>
                            {conversation.last_message_sender === 'customer' && (
                              <span className="text-gray-500">You: </span>
                            )}
                            {conversation.last_message_content.substring(0, 50)}
                            {conversation.last_message_content.length > 50 ? '...' : ''}
                          </span>
                        ) : (
                          <span className="text-gray-400">No messages yet</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={providerProfiles[selectedConversation.provider_id]?.profilePicture} />
                      <AvatarFallback className="bg-green-100 text-green-600">
                        {providerProfiles[selectedConversation.provider_id]?.businessName?.charAt(0)?.toUpperCase() || 
                         providerProfiles[selectedConversation.provider_id]?.name?.charAt(0)?.toUpperCase() || 'P'}
                      </AvatarFallback>
                    </Avatar>
                    {onlineUsers.has(selectedConversation.provider_id) && (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                    )}
                  </div>
                  
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {providerProfiles[selectedConversation.provider_id]?.businessName || 
                       providerProfiles[selectedConversation.provider_id]?.name || 'Service Provider'}
                    </h2>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <span className="flex items-center">
                        <span className={`w-2 h-2 rounded-full mr-2 ${
                          onlineUsers.has(selectedConversation.provider_id) ? 'bg-green-500' : 'bg-gray-400'
                        }`}></span>
                        {onlineUsers.has(selectedConversation.provider_id) ? 'Online' : `Last seen ${formatTime(selectedConversation.last_message_at)}`}
                      </span>
                    </div>
                  </div>
                </div>
                
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender_type === 'customer' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.sender_type === 'customer'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-900'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <div className={`flex items-center justify-between mt-1 ${
                      message.sender_type === 'customer' ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      <p className="text-xs">
                        {new Date(message.created_at).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                      {message.sender_type === 'customer' && (
                        <div className="ml-2">
                          {message.id.startsWith('temp_') ? (
                            <Clock className="h-3 w-3" />
                          ) : (
                            <CheckCheck className="h-3 w-3" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Typing Indicator */}
              {typingUsers.size > 0 && (
                <div className="flex justify-start">
                  <div className="bg-gray-200 px-4 py-2 rounded-lg">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="bg-white border-t border-gray-200 p-4">
              <div className="flex space-x-2">
                <Input
                  ref={messageInputRef}
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  className="flex-1"
                  disabled={sending}
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sending}
                  size="sm"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          /* No Conversation Selected */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <MessageCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
              <p className="text-sm">Choose a conversation from the left to start chatting</p>
            </div>
          </div>
        )}
      </div>

      {/* Error Toast */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg">
          <p>{error}</p>
          <button 
            onClick={() => setError(null)}
            className="ml-2 text-white hover:text-gray-200"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}

