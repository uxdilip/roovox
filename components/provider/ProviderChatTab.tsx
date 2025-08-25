"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtimeChat } from '@/hooks/use-realtime-chat';
import { useChat } from '@/contexts/ChatContext';
import { databases, DATABASE_ID, COLLECTIONS, client } from '@/lib/appwrite';
import { realtimeChat } from '@/lib/realtime-chat';
import { Query } from 'appwrite';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createOffer, getOffersForConversation, Offer } from '@/lib/offer-services';
import { 
  MessageCircle, 
  Send, 
  Search,
  Clock,
  Smartphone,
  Laptop,
  User,
  AlertCircle,
  Check,
  CheckCheck,
  MoreVertical,
  Briefcase,
  Calendar,
  Shield,
  Package,
  CheckCircle,
  XCircle
} from 'lucide-react';

export default function ProviderChatTab() {
  const { user } = useAuth();
  const { setActiveConversation } = useChat();
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [customerProfiles, setCustomerProfiles] = useState<Record<string, any>>({});
  
  // ✅ FIXED: Offer creation state with device selection
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerData, setOfferData] = useState({
    price: '',
    timeline: '',
    warranty: '',
    partsType: '',
    description: '',
    selectedServices: [] as string[],
    // ✅ FIXED: Add device selection fields
    deviceBrand: '',
    deviceModel: '',
    deviceCategory: 'phone' as 'phone' | 'laptop'
  });
  const [isSubmittingOffer, setIsSubmittingOffer] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  
  // ✅ FIXED: Add device selection state
  const [availableBrands, setAvailableBrands] = useState<string[]>([]);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isLoadingDeviceData, setIsLoadingDeviceData] = useState(false);
  
  // Offers display state
  const [offers, setOffers] = useState<Offer[]>([]);

  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // ✅ FIXED: Replace hardcoded arrays with database-driven state
  const [availableServices, setAvailableServices] = useState<any[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(false);
  const [allDevices, setAllDevices] = useState<any[]>([]); // Store all devices for filtering
  
  // ✅ FIXED: Helper functions for offer creation (same as customer flow)
  const getServicesForDevice = (category: string) => {
    // Return services based on category from database (same structure as customer flow)
    return availableServices.map(service => service.name);
  };

  const handleServiceToggle = (service: string) => {
    setOfferData(prev => ({
      ...prev,
      selectedServices: prev.selectedServices.includes(service)
        ? prev.selectedServices.filter(s => s !== service)
        : [...prev.selectedServices, service]
    }));
    
    // Hide validation error if services are now selected
    if (offerData.selectedServices.length === 0 && showValidation) {
      setShowValidation(false);
    }
  };

  const isServiceSelected = (service: string) => {
    return offerData.selectedServices.includes(service);
  };

  // ✅ FIXED: Load device data and services from database
  const loadDeviceData = async () => {
    if (!selectedConversation?.device_info?.category) return;
    
    setIsLoadingDeviceData(true);
    setIsLoadingServices(true);
    
    try {
      const { databases, DATABASE_ID, COLLECTIONS } = await import('@/lib/appwrite');
      
      // ✅ FIXED: Use the same functions as customer flow for complete data
      const { getPhones, getLaptops } = await import('@/lib/appwrite-services');
      
      let devices;
      if (selectedConversation.device_info.category === 'phone') {
        devices = await getPhones();
      } else {
        devices = await getLaptops();
      }
      
      // ✅ FIXED: Store all devices for filtering
      setAllDevices(devices);
      
      // Extract unique brands and models (same as customer booking flow)
      const brands = [...new Set(devices.map((doc: any) => doc.brand))].sort();
      const models = [...new Set(devices.map((doc: any) => doc.model))].sort();
      
      setAvailableBrands(brands);
      setAvailableModels(models);
      
      // ✅ FIXED: Load services from database (same as customer flow)
      try {
        // First get the category ID for the device type (same as customer flow)
        const categoriesRes = await databases.listDocuments(DATABASE_ID, 'categories', []);
        const category = categoriesRes.documents.find((c: any) => 
          c.name.toLowerCase() === selectedConversation.device_info.category
        );
        
        if (category) {
          // Use the same function as customer flow to get issues
          const { getIssuesByCategory } = await import('@/lib/appwrite-services');
          const fetchedIssues = await getIssuesByCategory(category.$id);
          setAvailableServices(fetchedIssues);
        } else {
          console.warn('No category found for device type:', selectedConversation.device_info.category);
          setAvailableServices([]);
        }
      } catch (servicesError) {
        console.warn('Could not load services from database:', servicesError);
        setAvailableServices([]); // No hardcoded fallback, just empty array
      }
      
      // Auto-populate with customer's device info
      if (selectedConversation.device_info) {
        setOfferData(prev => ({
          ...prev,
          deviceBrand: selectedConversation.device_info.brand || '',
          deviceModel: selectedConversation.device_info.model || '',
          deviceCategory: selectedConversation.device_info.category || 'phone'
        }));
      }
    } catch (error) {
      console.error('Error loading device data:', error);
    } finally {
      setIsLoadingDeviceData(false);
      setIsLoadingServices(false);
    }
  };

  // ✅ FIXED: Load device data for specific category (when provider changes device type)
  const loadDeviceDataForCategory = async (category: 'phone' | 'laptop') => {
    setIsLoadingDeviceData(true);
    setIsLoadingServices(true);
    
    try {
      const { databases, DATABASE_ID, COLLECTIONS } = await import('@/lib/appwrite');
      
      // ✅ FIXED: Use the same functions as customer flow for complete data
      const { getPhones, getLaptops } = await import('@/lib/appwrite-services');
      
      let devices;
      if (category === 'phone') {
        devices = await getPhones();
      } else {
        devices = await getLaptops();
      }
      
      // ✅ FIXED: Store all devices for filtering
      setAllDevices(devices);
      
      // Extract unique brands and models (same as customer booking flow)
      const brands = [...new Set(devices.map((doc: any) => doc.brand))].sort();
      const models = [...new Set(devices.map((doc: any) => doc.model))].sort();
      
      setAvailableBrands(brands);
      setAvailableModels(models);
      
      // ✅ FIXED: Also load services for the new category (same as customer flow)
      try {
        const categoriesRes = await databases.listDocuments(DATABASE_ID, 'categories', []);
        const categoryObj = categoriesRes.documents.find((c: any) => 
          c.name.toLowerCase() === category
        );
        
        if (categoryObj) {
          const { getIssuesByCategory } = await import('@/lib/appwrite-services');
          const fetchedIssues = await getIssuesByCategory(categoryObj.$id);
          setAvailableServices(fetchedIssues);
        } else {
          console.warn('No category found for device type:', category);
          setAvailableServices([]);
        }
      } catch (servicesError) {
        console.warn('Could not load services for category:', category, servicesError);
        setAvailableServices([]);
      }
      
      // Update the device category in offer data
      setOfferData(prev => ({
        ...prev,
        deviceCategory: category,
        deviceBrand: '',
        deviceModel: ''
      }));
      
    } catch (error) {
      console.error('Error loading device data for category:', error);
    } finally {
      setIsLoadingDeviceData(false);
      setIsLoadingServices(false);
    }
  };

  const handleCreateOffer = () => {
    setShowOfferModal(true);
    setShowValidation(false); // Reset validation state when opening modal
    loadDeviceData(); // Load device data when opening modal
  };

  const handleSubmitOffer = async () => {
    if (!selectedConversation || !user) return;
    
    // ✅ FIXED: Show validation errors if form is incomplete (including device selection)
    if (!offerData.price.trim() || !offerData.timeline.trim() || !offerData.warranty.trim() || 
        !offerData.partsType.trim() || !offerData.description.trim() || offerData.selectedServices.length === 0 ||
        !offerData.deviceBrand.trim() || !offerData.deviceModel.trim()) {
      setShowValidation(true);
      return; // Don't submit, show validation errors
    }
    
    setIsSubmittingOffer(true);
    
    try {
      // ✅ FIXED: Create offer using the service with device information
      const result = await createOffer({
        conversation_id: selectedConversation.id,
        provider_id: user.id,
        customer_id: selectedConversation.customer_id,
        price: offerData.price,
        timeline: offerData.timeline,
        warranty: offerData.warranty,
        parts_type: offerData.partsType,
        description: offerData.description,
        selected_services: offerData.selectedServices,
        // ✅ FIXED: Include device information
        device_info: {
          brand: offerData.deviceBrand,
          model: offerData.deviceModel,
          category: offerData.deviceCategory
        }
      });

      if (result.success) {

        
        // ✅ FIXED: Close modal and reset form with all fields
        setShowOfferModal(false);
        setOfferData({
          price: '',
          timeline: '',
          warranty: '',
          partsType: '',
          description: '',
          selectedServices: [],
          deviceBrand: '',
          deviceModel: '',
          deviceCategory: 'phone'
        });

        // Refresh offers list
        fetchOffersForConversation(selectedConversation.id);
        
        // Success - offer created and modal closed
        
      } else {
        console.error('❌ Failed to create offer:', result.error);
        // Error will be logged to console for debugging
      }
      
    } catch (error) {
      console.error('Error creating offer:', error);
      // Error will be logged to console for debugging
    } finally {
      setIsSubmittingOffer(false);
    }
  };

  // Function to fetch offers for the current conversation
  const fetchOffersForConversation = async (conversationId: string) => {
    if (!conversationId) return;
    
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
    }
  };

  // Use the real-time chat hook for providers
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
    userType: 'provider'
  });

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(scrollToBottom, 100);
    }
  }, [messages, scrollToBottom]);

  // Fetch customer profiles when conversations are loaded
  useEffect(() => {
    const fetchProfiles = async () => {
      const customerIds = Array.from(new Set(conversations.map(conv => conv.customer_id)));
      
      for (const customerId of customerIds) {
        if (!customerProfiles[customerId]) {
          const profile = await fetchCustomerProfile(customerId);
          if (profile) {
            setCustomerProfiles(prev => ({ ...prev, [customerId]: profile }));
          }
        }
      }
    };

    if (conversations.length > 0) {
      fetchProfiles();
    }
  }, [conversations]);

  // Fetch offers when conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      fetchOffersForConversation(selectedConversation.id);
      
      // Set active conversation for smart notifications
      setActiveConversation(selectedConversation.id);
    } else {
      // Clear active conversation when none selected
      setActiveConversation(null);
    }
  }, [selectedConversation, setActiveConversation]);

  // ✅ NEW: Real-time updates for offers
  useEffect(() => {
    if (!selectedConversation) return;

    // Subscribe to offer updates
    const unsubscribe = client.subscribe(
      `databases.${DATABASE_ID}.collections.${COLLECTIONS.OFFERS}.documents`,
      (response: any) => {
        if (response.events.includes('databases.*.collections.*.documents.*.update')) {
          fetchOffersForConversation(selectedConversation.id);
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [selectedConversation]);

  // Fetch customer profile (cached)
  const fetchCustomerProfile = useCallback(async (customerId: string) => {

    
    try {
      // Try multiple collection approaches
      let profile = null;
      
      // 1. Try customers collection first (if it exists)
      try {
        const customerRes = await databases.listDocuments(
          DATABASE_ID,
          'customers',
          [Query.equal('user_id', customerId), Query.limit(1)]
        );
        
        if (customerRes.documents.length > 0) {
          const customer = customerRes.documents[0];

          profile = {
            id: customerId,
            name: customer.full_name || customer.name || 'Customer',
            email: customer.email || '',
            phone: customer.phone || '',
            profilePicture: customer.profilePicture || ''
          };
        }
      } catch (customerError) {
        // Silently handle customer collection errors
      }
      
      // 2. If not found, try User collection by user_id field
      if (!profile) {
        try {
          const userRes = await databases.listDocuments(
            DATABASE_ID,
            'User',
            [Query.equal('user_id', customerId), Query.limit(1)]
          );
          
          if (userRes.documents.length > 0) {
            const user = userRes.documents[0];

            profile = {
              id: customerId,
              name: user.name || 'Customer',
              email: user.email || '',
              phone: user.phone || '',
              profilePicture: user.profilePicture || ''
            };
          }
        } catch (userError) {
          // Silently handle user collection errors
        }
      }
      
      // 3. If still not found, try User collection by document $id
      if (!profile) {
        try {
          const userDoc = await databases.getDocument(DATABASE_ID, 'User', customerId);

          profile = {
            id: customerId,
            name: userDoc.name || 'Customer',
            email: userDoc.email || '',
            phone: userDoc.phone || '',
            profilePicture: userDoc.profilePicture || ''
          };
        } catch (getError) {
          // Silently handle document ID errors
        }
      }
      
      if (profile) {
        return profile;
      }


      return {
        id: customerId,
        name: 'Customer',
        email: '',
        phone: '',
        profilePicture: ''
      };
    } catch (error) {

      return {
        id: customerId,
        name: 'Customer',
        email: '',
        phone: '',
        profilePicture: ''
      };
    }
  }, []);

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
    const customer = customerProfiles[conv.customer_id];
    if (!customer) return true;
    
    return customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
    return date.toLocaleDateString();
  };

  const getDeviceIcon = (category: string) => {
    return category === 'phone' ? <Smartphone className="h-4 w-4" /> : <Laptop className="h-4 w-4" />;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  if (!user) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-600">Please log in to access your chats</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[600px] bg-gray-50 rounded-lg border">
      {/* Left Sidebar - Conversations List */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col rounded-l-lg">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            Customer Messages
            {loading && <div className="ml-2 w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>}
          </h2>
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
              {searchQuery ? 'No conversations found' : 'No customer messages yet'}
            </div>
          ) : (
            filteredConversations.map((conversation) => {
              const customer = customerProfiles[conversation.customer_id];
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
                        <AvatarImage src={customer?.profilePicture} />
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          {customer?.name?.charAt(0)?.toUpperCase() || 'C'}
                        </AvatarFallback>
                      </Avatar>
                      {onlineUsers.has(conversation.customer_id) && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900 truncate">
                          {customer?.name || 'Customer'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatTime(conversation.last_message_at)}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-600 mt-1 line-clamp-1">
                        {conversation.last_message_content ? (
                          <span>
                            {conversation.last_message_sender === 'provider' && (
                              <span className="text-gray-500">You: </span>
                            )}
                            {conversation.last_message_content.substring(0, 50)}
                            {conversation.last_message_content.length > 50 ? '...' : ''}
                          </span>
                        ) : (
                          <span className="text-gray-400">Start a conversation</span>
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
            <div className="bg-white border-b border-gray-200 p-4 rounded-tr-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={customerProfiles[selectedConversation.customer_id]?.profilePicture} />
                      <AvatarFallback className="bg-blue-100 text-blue-600">
                        {customerProfiles[selectedConversation.customer_id]?.name?.charAt(0)?.toUpperCase() || 'C'}
                      </AvatarFallback>
                    </Avatar>
                    {onlineUsers.has(selectedConversation.customer_id) && (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                    )}
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {customerProfiles[selectedConversation.customer_id]?.name || 'Customer'}
                    </h3>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <span className="flex items-center">
                        <span className={`w-2 h-2 rounded-full mr-2 ${
                          onlineUsers.has(selectedConversation.customer_id) ? 'bg-green-500' : 'bg-gray-400'
                        }`}></span>
                        {onlineUsers.has(selectedConversation.customer_id) ? 'Online' : `Last seen ${formatTime(selectedConversation.last_message_at)}`}
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
                if (selectedConversation && offers.length > 0) {
                  offers.forEach(offer => {
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
                  className={`flex ${message.sender_type === 'provider' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.sender_type === 'provider'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-900'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <div className={`flex items-center justify-between mt-1 ${
                      message.sender_type === 'provider' ? 'text-green-100' : 'text-gray-500'
                    }`}>
                      <p className="text-xs">
                        {new Date(message.created_at).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                      {message.sender_type === 'provider' && (
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
                    const offer = item.data;
                    return (
                      <div key={offer.id} className="flex justify-end">
                        <div className="w-full max-w-2xl">
                          {/* Offer Header */}
                          <div className="flex items-center justify-between mb-4 p-3 bg-white rounded-lg border border-gray-200">
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-10 w-10">
                                <AvatarFallback className="bg-green-100 text-green-600">
                                  {customerProfiles[selectedConversation.customer_id]?.name?.charAt(0)?.toUpperCase() || 'C'}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <h3 className="font-semibold text-gray-900">
                                  {customerProfiles[selectedConversation.customer_id]?.name || 'Customer'}
                                </h3>
                                <p className="text-sm text-gray-600">You sent this offer</p>
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
                              {/* Offer Title & Price */}
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

                              {/* Status Display */}
                              <div className="pt-2 space-y-3">
                                {offer.status === 'pending' && (
                                  <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                                    <Clock className="h-4 w-4 mr-2" />
                                    Offer Pending - Waiting for customer response
                                  </Badge>
                                )}
                                
                                {offer.status === 'processing' && (
                                  <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                                    <Clock className="h-4 w-4 mr-2" />
                                    Payment Processing - Customer completing payment
                                  </Badge>
                                )}
                                
                                {offer.status === 'accepted' && (
                                  <div className="space-y-3">
                                    <Badge className="bg-green-100 text-green-800 border-green-200">
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Offer Accepted! Service confirmed
                                    </Badge>
                                    
                                    {offer.booking_id && (
                                      <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                                        <div className="flex items-center space-x-2">
                                          <CheckCircle className="h-5 w-5 text-green-600" />
                                          <span className="text-sm text-green-800">
                                            Booking ID: {offer.booking_id}
                                          </span>
                                        </div>
                                        <Button
                                          onClick={() => window.open(`/provider/bookings/${offer.booking_id}`, '_blank')}
                                          size="sm"
                                          className="bg-green-600 hover:bg-green-700 text-white"
                                        >
                                          View Booking
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                )}
                                
                                {offer.status === 'declined' && (
                                  <Badge className="bg-red-100 text-red-800 border-red-200">
                                    <XCircle className="h-5 w-5 mr-2" />
                                    Offer Declined
                                  </Badge>
                                )}
                              </div>
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
              
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="bg-white border-t border-gray-200 p-4 rounded-br-lg">
              <div className="flex space-x-2">
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  className="flex-1"
                  disabled={sending}
                />
                
                {/* Create Offer Button */}
                <Dialog open={showOfferModal} onOpenChange={setShowOfferModal}>
                  <DialogTrigger asChild>
                    <Button 
                      onClick={handleCreateOffer}
                      className="bg-primary hover:bg-primary/90"
                      size="sm"
                    >
                      <Briefcase className="h-4 w-4 mr-2" />
                      Create Offer
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Briefcase className="h-5 w-5" />
                        Create Service Offer
                      </DialogTitle>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                      {/* ✅ FIXED: Customer & Device Info with Device Selection */}
                      <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Customer</Label>
                          <p className="text-sm text-gray-900">
                            {customerProfiles[selectedConversation.customer_id]?.name || 'Customer'}
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Customer's Device</Label>
                          <p className="text-sm text-gray-900 flex items-center gap-2">
                            {selectedConversation.device_info?.category === 'phone' ? (
                              <Smartphone className="h-4 w-4" />
                            ) : (
                              <Laptop className="h-4 w-4" />
                            )}
                            {selectedConversation.device_info?.brand} {selectedConversation.device_info?.model}
                          </p>
                        </div>
                        
                        {/* ✅ FIXED: Device Selection Fields */}
                        <div className="col-span-2 space-y-3 pt-3 border-t border-gray-200">
                          <Label className="text-sm font-medium text-gray-700">Offer Device <span className="text-red-500">*</span></Label>
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <Label htmlFor="deviceCategory" className="text-xs text-gray-600">Category</Label>
                              <Select 
                                value={offerData.deviceCategory} 
                                onValueChange={(value: 'phone' | 'laptop') => {
                                  setOfferData(prev => ({ ...prev, deviceCategory: value, deviceBrand: '', deviceModel: '' }));
                                  // ✅ FIXED: Reload device data when category changes
                                  loadDeviceDataForCategory(value);
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="phone">Phone</SelectItem>
                                  <SelectItem value="laptop">Laptop</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="deviceBrand" className="text-xs text-gray-600">Brand</Label>
                              <Select 
                                value={offerData.deviceBrand} 
                                onValueChange={(value) => {
                                  setOfferData(prev => ({ ...prev, deviceBrand: value, deviceModel: '' }));
                                }}
                                disabled={isLoadingDeviceData}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select brand" />
                                </SelectTrigger>
                                <SelectContent>
                                  {availableBrands.map(brand => (
                                    <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="deviceModel" className="text-xs text-gray-600">Model</Label>
                              <Select 
                                value={offerData.deviceModel} 
                                onValueChange={(value) => {
                                  setOfferData(prev => ({ ...prev, deviceModel: value }));
                                }}
                                disabled={!offerData.deviceBrand || isLoadingDeviceData}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select model" />
                                </SelectTrigger>
                                <SelectContent>
                                  {availableModels
                                    .filter(model => {
                                      // ✅ FIXED: Filter models by selected brand (same as customer flow)
                                      if (!offerData.deviceBrand) return false;
                                      // Find the device with this model and check if it matches the selected brand
                                      return allDevices?.some(device => 
                                        device.brand === offerData.deviceBrand && device.model === model
                                      );
                                    })
                                    .map(model => (
                                      <SelectItem key={model} value={model}>{model}</SelectItem>
                                    ))
                                  }
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500">
                            💡 Tip: You can change the device if you want to offer services for a different model
                          </p>
                        </div>
                        <div className="col-span-2">
                          <Label className="text-sm font-medium text-gray-700">Services <span className="text-red-500">*</span></Label>
                          <div className="mt-2">
                            {isLoadingServices ? (
                              <div className="p-4 text-center text-gray-500">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                                Loading services...
                              </div>
                            ) : (
                              <div className={`max-h-32 overflow-y-auto border rounded-lg p-2 bg-white ${
                                showValidation && offerData.selectedServices.length === 0 ? 'border-red-300' : 'border-gray-200'
                              }`}>
                                {getServicesForDevice(offerData.deviceCategory || selectedConversation.device_info?.category || 'phone').map((service, index) => (
                                <div
                                  key={index}
                                  className={`flex items-center justify-between p-2 rounded cursor-pointer hover:bg-gray-50 ${
                                    isServiceSelected(service) ? 'bg-blue-50 border border-blue-200' : ''
                                  }`}
                                  onClick={() => handleServiceToggle(service)}
                                >
                                  <span className="text-sm text-gray-700">{service}</span>
                                  {isServiceSelected(service) ? (
                                    <Check className="h-4 w-4 text-blue-600" />
                                  ) : (
                                    <div className="h-4 w-4 border border-gray-300 rounded" />
                                  )}
                                </div>
                              ))}
                            </div>
                            )}
                            {offerData.selectedServices.length > 0 && (
                              <div className="mt-2">
                                <Label className="text-xs text-gray-600">Selected Services:</Label>
                                <div className="max-h-20 overflow-y-auto border border-gray-100 rounded p-2 bg-gray-50">
                                  <div className="flex flex-wrap gap-1">
                                    {offerData.selectedServices.map((service, index) => (
                                      <Badge 
                                        key={index} 
                                        variant="secondary" 
                                        className="text-xs bg-blue-100 text-blue-800 border-blue-200 flex-shrink-0"
                                      >
                                        {service}
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleServiceToggle(service);
                                          }}
                                          className="ml-1 hover:text-blue-600"
                                        >
                                          <span className="text-xs">×</span>
                                        </button>
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Offer Details Form */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="price">Price (₹) <span className="text-red-500">*</span></Label>
                          <Input
                            id="price"
                            type="number"
                            placeholder="Enter total amount"
                            value={offerData.price}
                            onChange={(e) => {
                              setOfferData({...offerData, price: e.target.value});
                              if (e.target.value.trim() && showValidation) setShowValidation(false);
                            }}
                            className={showValidation && !offerData.price.trim() ? 'border-red-300 focus:border-red-500' : ''}
                          />
                        </div>
                        <div>
                          <Label htmlFor="timeline">Timeline <span className="text-red-500">*</span></Label>
                          <Select value={offerData.timeline} onValueChange={(value) => {
                            setOfferData({...offerData, timeline: value});
                            if (value && showValidation) setShowValidation(false);
                          }}>
                            <SelectTrigger className={showValidation && !offerData.timeline.trim() ? 'border-red-300 focus:border-red-500' : ''}>
                              <SelectValue placeholder="Select timeline" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Same Day">Same Day</SelectItem>
                              <SelectItem value="1-2 Days">1-2 Days</SelectItem>
                              <SelectItem value="3-5 Days">3-5 Days</SelectItem>
                              <SelectItem value="1 Week">1 Week</SelectItem>
                              <SelectItem value="2 Weeks">2 Weeks</SelectItem>
                              <SelectItem value="Flexible">Flexible</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="warranty">Warranty <span className="text-red-500">*</span></Label>
                          <Input
                            id="warranty"
                            placeholder="e.g., 6 months, 1 year, no warranty"
                            value={offerData.warranty}
                            onChange={(e) => {
                              setOfferData({...offerData, warranty: e.target.value});
                              if (e.target.value.trim() && showValidation) setShowValidation(false);
                            }}
                            className={showValidation && !offerData.warranty.trim() ? 'border-red-300 focus:border-red-500' : ''}
                          />
                        </div>
                        <div>
                          <Label htmlFor="partsType">Parts Quality <span className="text-red-500">*</span></Label>
                          <Select value={offerData.partsType} onValueChange={(value) => {
                            setOfferData({...offerData, partsType: value});
                            if (value && showValidation) setShowValidation(false);
                          }}>
                            <SelectTrigger className={showValidation && !offerData.partsType.trim() ? 'border-red-300 focus:border-red-500' : ''}>
                              <SelectValue placeholder="Select parts quality" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Original OEM Parts">Original OEM Parts</SelectItem>
                              <SelectItem value="Aftermarket High Quality">Aftermarket High Quality</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="description">Service Description <span className="text-red-500">*</span></Label>
                        <Textarea
                          id="description"
                          placeholder="Describe what services are included, what parts will be used, and any special considerations..."
                          rows={4}
                          value={offerData.description}
                          onChange={(e) => {
                            setOfferData({...offerData, description: e.target.value});
                            if (e.target.value.trim() && showValidation) setShowValidation(false);
                          }}
                          className={showValidation && !offerData.description.trim() ? 'border-red-300 focus:border-red-500' : ''}
                        />
                      </div>

                      <div className="flex justify-end space-x-2 pt-4">
                        <Button variant="outline" onClick={() => {
                          setShowOfferModal(false);
                          setShowValidation(false); // Reset validation when closing
                        }}>
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleSubmitOffer}
                          disabled={isSubmittingOffer || !offerData.price.trim() || !offerData.timeline.trim() || 
                                   !offerData.warranty.trim() || !offerData.partsType.trim() || 
                                   !offerData.description.trim() || offerData.selectedServices.length === 0 ||
                                   !offerData.deviceBrand.trim() || !offerData.deviceModel.trim()}
                          className="min-w-[120px]"
                        >
                          {isSubmittingOffer ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Creating...
                            </>
                          ) : (
                            <>
                          <Briefcase className="h-4 w-4 mr-2" />
                          Send Offer
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                
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
              <p className="text-sm">Choose a customer conversation from the left to start responding</p>
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
    </div>
  );
}

