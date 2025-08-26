"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtimeChat } from '@/hooks/use-realtime-chat';
import { useChat } from '@/contexts/ChatContext';
import { databases, DATABASE_ID, COLLECTIONS, client } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { getOffersForConversation, acceptOffer, declineOffer, Offer } from '@/lib/offer-services';
import { 
  MessageCircle, 
  Send, 
  Search,
  Clock,
  Smartphone,
  Laptop,
  Check,
  CheckCheck,
  MoreVertical,
  Briefcase,
  Calendar,
  Shield,
  Package,
  Star,
  AlertCircle,
  CheckCircle,
  XCircle,
  ArrowRight
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ChatPage() {
  const { user, activeRole } = useAuth();
  const { setActiveConversation } = useChat();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Set active conversation when conversation changes
  useEffect(() => {
    const conversationId = searchParams.get('conversation') || searchParams.get('id');
    setActiveConversation(conversationId);
  }, [searchParams, setActiveConversation]);
  
  // Fresh notification system will be implemented here
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [providerProfiles, setProviderProfiles] = useState<Record<string, any>>({});

  // Offer management state
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [decliningOfferId, setDecliningOfferId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Real offers from database
  const [offers, setOffers] = useState<Offer[]>([]);
  const [offersLoading, setOffersLoading] = useState(false);

  // Helper functions for offer management
  const fetchOffersForConversation = async (conversationId: string) => {
    if (!conversationId) return;
    
    setOffersLoading(true);
    try {
      const result = await getOffersForConversation(conversationId);
      if (result.success && result.offers) {
        setOffers(result.offers);
      } else {
        console.error('Failed to fetch offers:', result.error);
        setOffers([]);
      }
    } catch (error) {
      console.error('Error fetching offers:', error);
      setOffers([]);
    } finally {
      setOffersLoading(false);
    }
  };

  const handleAcceptOffer = async (offerId: string) => {
    try {
      // Don't update offer status yet - wait for payment completion
      
      // Update local state to show "Processing..." instead of "Accepted"
      setOffers(prev => prev.map(offer => 
        offer.id === offerId 
          ? { ...offer, status: 'processing' as any }
          : offer
      ));
      
      // Redirect to booking page with offer context
      router.push(`/book?offer_id=${offerId}&mode=from_offer`);
      
    } catch (error) {
      console.error('Error accepting offer:', error);
    }
  };

  const handleDeclineOffer = (offerId: string) => {
    setDecliningOfferId(offerId);
    setShowDeclineModal(true);
  };

  const handleConfirmDecline = async () => {
    if (!decliningOfferId || !declineReason.trim()) return;
    
    try {
      const result = await declineOffer(decliningOfferId, declineReason);
      if (result.success) {

        
        // Update local state
        setOffers(prev => prev.map(offer => 
          offer.id === decliningOfferId 
            ? { ...offer, status: 'declined' as const, decline_reason: declineReason }
            : offer
        ));
        
        // Close modal and reset
        setShowDeclineModal(false);
        setDeclineReason('');
        setDecliningOfferId(null);
        
      } else {
        console.error('❌ Failed to decline offer:', result.error);
      }
      
    } catch (error) {
      console.error('Error declining offer:', error);
    }
  };

  const getOfferStatusBadge = (status: string) => {
    switch (status) {
      case 'processing':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Processing...</Badge>;
      case 'accepted':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Accepted</Badge>;
      case 'declined':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Declined</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>;
    }
  };
  
  // Use the real-time chat hook
  const {
    conversations,
    selectedConversation,
    messages,
    loading,
    sending,
    error,
    typingUsers,
    onlineUsers,
    setSelectedConversation,
    sendMessage: sendRealtimeMessage,
    clearError,
    startTyping,
    stopTyping
  } = useRealtimeChat({
    userId: user?.id || '',
    userType: 'customer'
  });

  // Cleanup function for Appwrite connections
  const cleanupAppwriteConnections = useCallback(() => {
    try {
      // Clean up real-time chat connections
      if (typeof window !== 'undefined') {
        // Make cleanup function available globally
        (window as any).appwriteCleanup = () => {
          try {
            // Import and use the realtime chat cleanup
            import('@/lib/realtime-chat').then(({ realtimeChat }) => {
              realtimeChat.cleanup();
            });
          } catch (error) {
            // Silently handle cleanup errors
          }
        };
      }
    } catch (error) {
      // Silently handle cleanup warnings
    }
  }, []);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      cleanupAppwriteConnections();
    };
  }, [cleanupAppwriteConnections]);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Track if this is the first time loading messages for a conversation
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [userHasScrolled, setUserHasScrolled] = useState(false);

  // Handle scroll events to detect user scrolling
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const isAtBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 50;
    
    // User has scrolled if they're not at bottom
    setUserHasScrolled(!isAtBottom);
  }, []);

  // WhatsApp behavior: Always scroll to bottom when first opening chat
  useEffect(() => {
    if (messages.length > 0 && selectedConversation && isFirstLoad) {
      // Scroll to bottom when first opening chat (like WhatsApp)
      setTimeout(scrollToBottom, 100);
      setIsFirstLoad(false);
    }
  }, [messages, scrollToBottom, selectedConversation, isFirstLoad]);

  // Auto-scroll for new messages only if user is at bottom
  useEffect(() => {
    if (messages.length > 0 && selectedConversation && !isFirstLoad) {
      const lastMessage = messages[messages.length - 1];
      const isNewMessage = lastMessage && 
        new Date(lastMessage.created_at).getTime() > Date.now() - 5000; // Within last 5 seconds
      
      if (isNewMessage && !userHasScrolled) {
        setTimeout(scrollToBottom, 100);
      }
    }
  }, [messages, scrollToBottom, selectedConversation, isFirstLoad, userHasScrolled]);

  // Fetch provider profiles when conversations are loaded
  useEffect(() => {
    const fetchProfiles = async () => {
      const providerIds = Array.from(new Set(conversations.map(conv => conv.provider_id)));
      const profiles: Record<string, any> = {};
      
      for (const providerId of providerIds) {
        if (!providerProfiles[providerId]) {
          profiles[providerId] = await fetchProviderProfile(providerId);
        }
      }
      
      if (Object.keys(profiles).length > 0) {
        setProviderProfiles(prev => ({ ...prev, ...profiles }));
      }
    };

    if (conversations.length > 0) {
      fetchProfiles();
    }
  }, [conversations, providerProfiles]);

  // Auto-select provider from URL query parameter
  useEffect(() => {
    if (conversations.length > 0 && !selectedConversation) {
      const providerId = searchParams.get('provider');
      if (providerId) {
        const conversation = conversations.find(conv => conv.provider_id === providerId);
        if (conversation) {
          setSelectedConversation(conversation);
        }
      }
    }
  }, [conversations, selectedConversation, searchParams]);

  // Fetch offers when conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      fetchOffersForConversation(selectedConversation.id);
      // Reset scroll behavior for new conversation
      setIsFirstLoad(true);
      setUserHasScrolled(false);
    }
  }, [selectedConversation]);

  // ✅ NEW: Real-time updates for offers
  useEffect(() => {
    if (!selectedConversation) return;

    // Subscribe to offer updates
    const unsubscribe = client.subscribe(
      `databases.${DATABASE_ID}.collections.${COLLECTIONS.OFFERS}.documents`,
      (response) => {
        if (response.events.includes('databases.*.collections.*.documents.*.update')) {
          fetchOffersForConversation(selectedConversation.id);
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [selectedConversation]);

  const fetchProviderProfile = async (providerId: string) => {
    try {
      // Try to get provider from User collection first
      const userRes = await databases.listDocuments(
        DATABASE_ID,
        'User',
        [Query.equal('user_id', providerId), Query.limit(1)]
      );

      if (userRes.documents.length > 0) {
        const user = userRes.documents[0];
        
        // Try to get business info
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

        return {
          id: providerId,
          name: user.name,
          businessName: businessName,
          email: user.email,
          phone: user.phone,
          profilePicture: user.profilePicture
        };
      }

      return {
        id: providerId,
        name: 'Provider',
        businessName: 'Service Provider',
        email: '',
        phone: ''
      };
    } catch (error) {
      console.error('Error fetching provider profile:', error);
      return {
        id: providerId,
        name: 'Provider',
        businessName: 'Service Provider',
        email: '',
        phone: ''
      };
    }
  };

  // Handle sending messages with real-time updates
  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    stopTyping(); // Clear typing indicator

    await sendRealtimeMessage(messageText);
  };

  // Handle typing indicators
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);

    // Send typing indicator
    if (e.target.value.trim() && !typingTimeoutRef.current) {
      startTyping();
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
      typingTimeoutRef.current = undefined;
    }, 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const filteredConversations = conversations.filter(conv => {
    const provider = providerProfiles[conv.provider_id];
    if (!provider) return true;
    
    return provider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           provider.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
           (conv.device_info?.brand?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
           (conv.device_info?.model?.toLowerCase().includes(searchQuery.toLowerCase()) || false);
  });

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)} days ago`;
    if (diffInHours < 672) return `${Math.floor(diffInHours / 168)} weeks ago`;
    return `${Math.floor(diffInHours / 672)} months ago`;
  };

  const getDeviceIcon = (category: string) => {
    return category === 'phone' ? <Smartphone className="h-4 w-4" /> : <Laptop className="h-4 w-4" />;
  };

  // Remove authentication check since customers can only access this page when logged in
  // The page is protected by the route structure

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar - Conversations List */}
      <div className={`${selectedConversation ? 'hidden md:flex md:w-80' : 'w-full md:w-80'} bg-white border-r border-gray-200 flex flex-col`}>
        {/* Mobile Header with Back Button */}
        <div className="md:hidden p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold text-gray-900">All messages</h1>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setSelectedConversation(null)}
              className="md:hidden"
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {/* Header */}
        <div className="p-2 md:p-4 border-b border-gray-200">
          <h1 className="text-lg font-semibold text-gray-900">All messages</h1>
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
          {loading && conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mx-auto mb-2"></div>
              Loading...
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <MessageCircle className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              {searchQuery ? 'No conversations found' : 'No conversations yet'}
            </div>
          ) : (
            filteredConversations.map((conversation) => {
              const provider = providerProfiles[conversation.provider_id];
              return (
                <div
                  key={conversation.id}
                  onClick={() => setSelectedConversation(conversation)}
                  className={`p-3 md:p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors active:bg-gray-100 ${
                    selectedConversation?.id === conversation.id ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                >
                  <div className="flex items-start space-x-2 md:space-x-3">
                    <div className="relative">
                    <Avatar className="h-8 w-8 md:h-10 md:w-10">
                      <AvatarImage src={provider?.profilePicture} />
                      <AvatarFallback className="bg-green-100 text-green-600">
                        {provider?.businessName?.charAt(0)?.toUpperCase() || provider?.name?.charAt(0)?.toUpperCase() || 'P'}
                      </AvatarFallback>
                    </Avatar>
                      {onlineUsers.has(conversation.provider_id) && (
                        <div className="absolute -bottom-1 -right-1 w-2 h-2 md:w-3 md:h-3 bg-green-500 border-2 border-white rounded-full"></div>
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
                            {conversation.last_message_sender === 'customer' ? 'You: ' : ''}
                            {conversation.last_message_content.substring(0, 60)}
                            {conversation.last_message_content.length > 60 ? '...' : ''}
                          </span>
                        ) : (
                          <span className="text-gray-400">No messages yet</span>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2 mt-2">
                        {getDeviceIcon(conversation.device_info?.category)}
                        <span className="text-xs text-gray-500">
                          {conversation.device_info?.brand} {conversation.device_info?.model}
                        </span>
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
      <div className={`${selectedConversation ? 'flex-1 flex flex-col' : 'hidden md:flex md:flex-1 md:flex-col'} w-full`}>
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 p-2 md:p-4 sticky top-0 z-20">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {/* Mobile Back Button */}
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setSelectedConversation(null)}
                    className="md:hidden mr-2"
                  >
                    <ArrowRight className="h-4 w-4 rotate-180" />
                  </Button>
                  
                  <div className="relative">
                  <Avatar className="h-8 w-8 md:h-10 md:w-10">
                    <AvatarImage src={providerProfiles[selectedConversation.provider_id]?.profilePicture} />
                    <AvatarFallback className="bg-green-100 text-green-600">
                      {providerProfiles[selectedConversation.provider_id]?.businessName?.charAt(0)?.toUpperCase() || 
                       providerProfiles[selectedConversation.provider_id]?.name?.charAt(0)?.toUpperCase() || 'P'}
                    </AvatarFallback>
                  </Avatar>
                    {onlineUsers.has(selectedConversation.provider_id) && (
                      <div className="absolute -bottom-1 -right-1 w-2 h-2 md:w-3 md:h-3 bg-green-500 border-2 border-white rounded-full"></div>
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
            <div 
              className="flex-1 overflow-y-auto p-2 md:p-4 space-y-4 messages-container"
              onScroll={handleScroll}
            >
              {/* Combine messages and offers in chronological order */}
              {(() => {
                // Create a combined array of messages and offers
                const allItems: Array<{
                  type: 'message' | 'offer';
                  id: string;
                  timestamp: number;
                  data: any;
                }> = [];
                
                // Add messages
                messages.forEach(message => {
                  allItems.push({
                    type: 'message',
                    id: message.id,
                    timestamp: new Date(message.created_at).getTime(),
                    data: message
                  });
                });
                
                // Add offers
                if (selectedConversation) {
                  offers
                    .filter((offer: Offer) => offer.provider_id === selectedConversation.provider_id)
                    .forEach(offer => {
                      allItems.push({
                        type: 'offer',
                        id: offer.id,
                        timestamp: new Date(offer.created_at).getTime(),
                        data: offer
                      });
                    });
                }
                
                // Sort by timestamp (oldest first)
                allItems.sort((a, b) => a.timestamp - b.timestamp);
                
                // Render items in order
                return allItems.map(item => {
                  if (item.type === 'message') {
                    const message = item.data;
                    return (
                <div
                  key={message.id}
                  className={`flex ${message.sender_type === 'customer' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] md:max-w-xs lg:max-w-md px-3 md:px-4 py-2 rounded-lg ${
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
                    );
                  } else if (item.type === 'offer') {
                    const offer = item.data as Offer;
                    return (
                      <div key={offer.id} className="flex justify-start">
                        <div className="w-full max-w-2xl">
                          {/* Offer Header */}
                          <div className="flex items-center justify-between mb-4 p-3 bg-white rounded-lg border border-gray-200">
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-10 w-10">
                                <AvatarFallback className="bg-blue-100 text-blue-600">
                                  {providerProfiles[selectedConversation.provider_id]?.businessName?.charAt(0)?.toUpperCase() || 'P'}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <h3 className="font-semibold text-gray-900">
                                  {providerProfiles[selectedConversation.provider_id]?.businessName || 'Service Provider'}
                                </h3>
                                <p className="text-sm text-gray-600">Here's your custom offer</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-gray-500">
                                {new Date(offer.created_at).toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric' 
                                })} at {new Date(offer.created_at).toLocaleTimeString([], { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </div>
                              <button className="text-gray-400 hover:text-gray-600">
                                <span className="text-lg">⋯</span>
                              </button>
                            </div>
                          </div>
                          
                          <Card className="border border-gray-200 bg-white shadow-sm">
                            <CardContent className="p-6">
                              {/* Device Model & Price */}
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                  <h2 className="text-lg font-semibold text-gray-900 mb-2">
                                    {selectedConversation.device_info?.brand} {selectedConversation.device_info?.model}
                                  </h2>
                                </div>
                                <div className="text-right ml-4">
                                  <div className="text-2xl font-bold text-green-600">{offer.price}</div>
                                  <div className="text-sm text-gray-500">Total Price</div>
                                </div>
                              </div>

                              {/* Offer Inclusions */}
                              <div className="mb-6">
                                <h3 className="font-medium text-gray-900 mb-3">Your offer includes:</h3>
                                <div className="space-y-2">
                                  <div className="flex items-center space-x-2">
                                    <Calendar className="h-4 w-4 text-gray-500" />
                                    <span className="text-sm text-gray-700">{offer.timeline} Delivery</span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Shield className="h-4 w-4 text-gray-500" />
                                    <span className="text-sm text-gray-700">{offer.warranty} Warranty</span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Briefcase className="h-4 w-4 text-gray-500" />
                                    <span className="text-sm text-gray-700">{offer.parts_type}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Services List */}
                              <div className="mb-6">
                                <h3 className="font-medium text-gray-900 mb-3">Services included:</h3>
                                <div className="grid grid-cols-2 gap-2">
                                  {offer.selected_services.map((service: string, index: number) => (
                                    <div key={index} className="flex items-center space-x-2">
                                      <Check className="h-4 w-4 text-green-500" />
                                      <span className="text-sm text-gray-700">{service}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Service Description */}
                              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                                <h3 className="font-medium text-gray-900 mb-2">Service Description:</h3>
                                <p className="text-sm text-gray-600">{offer.description}</p>
                              </div>

                              {/* Action Buttons for Customer */}
                              {offer.status === 'pending' && (
                                <div className="flex justify-end space-x-3">
                                  <Button 
                                    onClick={() => handleDeclineOffer(offer.id)}
                                    variant="outline"
                                    className="px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-50"
                                  >
                                    Decline
                                  </Button>
                                  <Button 
                                    onClick={() => handleAcceptOffer(offer.id)}
                                    className="px-6 py-2 bg-gray-900 hover:bg-gray-800 text-white"
                                  >
                                    Accept
                                  </Button>
                                </div>
                              )}

                              {offer.status === 'processing' && (
                                <div className="pt-2">
                                  <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                                    <Clock className="h-4 w-4 mr-2" />
                                    Processing... Completing your booking
                                  </Badge>
                                </div>
                              )}

                              {offer.status === 'accepted' && (
                                <div className="pt-2 space-y-3">
                                  <Badge className="bg-green-100 text-green-800 border-green-200">
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Offer Accepted! Service confirmed
                                  </Badge>
                                  
                                  {offer.booking_id && (
                                    <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                                      <div className="flex items-center space-x-2">
                                        <CheckCircle className="h-5 w-5 text-green-600" />
                                        <span className="text-sm text-green-800">
                                          Order ID: {offer.booking_id}
                                        </span>
                                      </div>
                                      <Button
                                        onClick={() => router.push('/customer/my-bookings')}
                                        size="sm"
                                        className="bg-green-600 hover:bg-green-700 text-white"
                                      >
                                        View Order
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              )}

                              {offer.status === 'declined' && (
                                <div className="text-center py-4">
                                  <div className="inline-flex items-center space-x-2 bg-red-100 text-red-800 px-4 py-2 rounded-full">
                                    <XCircle className="h-5 w-5" />
                                    <span className="text-lg">Offer Declined</span>
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    );
                  }
                  return null;
                });
              })()}

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
              
              {/* New Messages Indicator (like WhatsApp) */}
              {userHasScrolled && messages.length > 0 && (
                <div className="flex justify-center mb-4">
                  <Button
                    onClick={scrollToBottom}
                    size="sm"
                    className="bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    New messages
                  </Button>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="bg-white border-t border-gray-200 p-2 md:p-4 sticky bottom-0 z-10">
              <div className="flex space-x-2">
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  className="flex-1 min-w-0"
                  disabled={sending}
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sending}
                  size="sm"
                  className="flex-shrink-0"
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
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          <div className="flex items-center justify-between">
            <p className="text-sm">{error}</p>
            <button 
              onClick={clearError}
              className="ml-3 text-white hover:text-gray-200 text-lg font-bold"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Decline Reason Modal */}
      <Dialog open={showDeclineModal} onOpenChange={setShowDeclineModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              Decline Offer
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="declineReason" className="text-sm font-medium text-gray-700">
                Please provide a reason for declining this offer
              </Label>
              <Textarea
                id="declineReason"
                placeholder="e.g., Price too high, timeline too long, prefer different parts quality..."
                rows={3}
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                className="mt-2"
              />
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setShowDeclineModal(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleConfirmDecline}
                disabled={!declineReason.trim()}
                className="bg-red-600 hover:bg-red-700"
              >
                Confirm Decline
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
