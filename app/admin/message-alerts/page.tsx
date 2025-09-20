"use client";

import React, { useState, useEffect } from 'react';
import { MessageNotificationEnvelope } from '@/components/ui/message-notification-envelope';
import { useAdminNotifications } from '@/hooks/use-admin-notifications';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, Search, Filter, MessageSquare, Clock, User, Phone, CheckCircle, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ChatModal } from '@/components/admin/ChatModal';

export default function MessageAlertsPage() {
  const { chatNotifications, chatUnreadCount, businessNotifications, businessUnreadCount, markAsRead, markAllAsRead, loading } = useAdminNotifications();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Chat modal state
  const [chatModal, setChatModal] = useState<{
    isOpen: boolean;
    conversationId: string;
    customerName: string;
    providerName: string;
  }>({
    isOpen: false,
    conversationId: '',
    customerName: '',
    providerName: ''
  });

  // Debug: Log all notifications data
  React.useEffect(() => {
    console.log('🔍 [DEBUG] All notifications:', {
      chat: chatNotifications,
      business: businessNotifications,
      total: [...chatNotifications, ...businessNotifications]
    });
  }, [chatNotifications, businessNotifications]);

  // Combine and filter notifications
  const allNotifications = [...chatNotifications, ...businessNotifications];
  
  const filteredNotifications = allNotifications.filter(notification => {
    // Filter out test notifications
    const isTestNotification = 
      notification.senderName?.toLowerCase().includes('test') ||
      notification.messagePreview?.toLowerCase().includes('test message to check if the alert system works') ||
      notification.message?.toLowerCase().includes('test message to check if the alert system works');
    
    const matchesSearch = notification.senderName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.messagePreview?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.message?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'all' || 
                         (filterType === 'unread' && !notification.read) ||
                         (filterType === 'read' && notification.read);
    
    const matchesCategory = selectedCategory === 'all' || 
                           notification.category === selectedCategory;
    
    return !isTestNotification && matchesSearch && matchesFilter && matchesCategory;
  });

  const handleNotificationClick = async (notificationId: string) => {
    await markAsRead(notificationId);
    // Here you could also navigate to the specific chat or booking
  };

  const handleViewChat = (conversationId: string, customerName: string, providerName: string) => {
    setChatModal({
      isOpen: true,
      conversationId,
      customerName,
      providerName
    });
  };

  const closeChatModal = () => {
    setChatModal({
      isOpen: false,
      conversationId: '',
      customerName: '',
      providerName: ''
    });
  };

  const totalUnread = chatUnreadCount + businessUnreadCount;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Message Alerts</h1>
          <p className="text-muted-foreground">
            Manage customer messages and notifications
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <MessageNotificationEnvelope />
          {totalUnread > 0 && (
            <Button onClick={() => markAllAsRead()} variant="outline" size="sm">
              Mark all as read ({totalUnread})
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allNotifications.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread Total</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{totalUnread}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chat Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{chatNotifications.length}</div>
            {chatUnreadCount > 0 && (
              <Badge variant="destructive" className="mt-1">
                {chatUnreadCount} unread
              </Badge>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Business Alerts</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{businessNotifications.length}</div>
            {businessUnreadCount > 0 && (
              <Badge variant="destructive" className="mt-1">
                {businessUnreadCount} unread
              </Badge>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filter Messages</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search messages..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Messages</SelectItem>
                <SelectItem value="unread">Unread Only</SelectItem>
                <SelectItem value="read">Read Only</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="chat">Chat Messages</SelectItem>
                <SelectItem value="business">Business Alerts</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Messages List */}
      <Card>
        <CardHeader>
          <CardTitle>Messages ({filteredNotifications.length})</CardTitle>
          <CardDescription>
            {filterType === 'unread' && 'Showing unread messages only'}
            {filterType === 'read' && 'Showing read messages only'}
            {filterType === 'all' && 'Showing all messages'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2">Loading messages...</span>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Mail className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p>No messages found</p>
              {searchTerm && (
                <p className="text-sm mt-2">
                  Try adjusting your search or filter criteria
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredNotifications.map((notification) => {
                // Parse metadata to get additional details like provider info
                let metadata: any = {};
                try {
                  // Handle both string and object metadata
                  if (typeof notification.metadata === 'string') {
                    metadata = JSON.parse(notification.metadata);
                  } else if (typeof notification.metadata === 'object' && notification.metadata !== null) {
                    metadata = notification.metadata;
                  } else {
                    metadata = {};
                  }
                } catch (e) {
                  console.error('🔍 [DEBUG] Failed to parse metadata:', notification.metadata);
                  metadata = {};
                }

                // Debug: Log notification data to console
                console.log('🔍 [DEBUG] Notification data:', {
                  id: notification.id,
                  senderName: notification.senderName,
                  metadata: metadata,
                  metadataRaw: notification.metadata,
                  metadataType: typeof notification.metadata,
                  category: notification.category,
                  providerName: metadata.providerName,
                  providerPhone: metadata.providerPhone
                });

                return (
                  <div
                    key={notification.id}
                    className={`p-4 border rounded-lg transition-colors ${
                      !notification.read ? 'bg-green-50 border-green-200' : 'bg-background'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`p-2 rounded-full ${
                          notification.category === 'chat' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'
                        }`}>
                          {notification.category === 'chat' ? (
                            <MessageSquare className="h-4 w-4" />
                          ) : (
                            <User className="h-4 w-4" />
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium">
                              {notification.senderName || 'Unknown Sender'}
                              {metadata.providerName && (
                                <span className="text-muted-foreground"> → {metadata.providerName}</span>
                              )}
                            </h3>
                            <Badge variant={notification.category === 'chat' ? 'default' : 'secondary'}>
                              {notification.category}
                            </Badge>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            )}
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-2">
                            {notification.messagePreview || notification.message || 'No message preview'}
                          </p>
                          
                          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDistanceToNow(new Date(notification.lastMessageAt || notification.createdAt), { addSuffix: true })}
                            </div>
                            {notification.type && (
                              <span className="capitalize">{notification.type}</span>
                            )}
                          </div>

                          {/* View Chat Button */}
                          <div className="flex gap-2 mt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-purple-600 border-purple-200 hover:bg-purple-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewChat(
                                  notification.relatedId, 
                                  notification.senderName || 'Customer',
                                  metadata.providerName || 'Provider'
                                );
                              }}
                              title={`View conversation ${notification.relatedId}`}
                            >
                              💬 View Chat
                            </Button>
                          </div>

                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chat Modal */}
      <ChatModal
        isOpen={chatModal.isOpen}
        onClose={closeChatModal}
        conversationId={chatModal.conversationId}
        customerName={chatModal.customerName}
        providerName={chatModal.providerName}
      />
    </div>
  );
}
