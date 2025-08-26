"use client";

import React, { useState } from 'react';
import { Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNotifications } from '@/hooks/use-notifications';
import { formatDistanceToNow } from 'date-fns';

interface MessageNotificationEnvelopeProps {
  variant?: 'default' | 'mobile';
}

export function MessageNotificationEnvelope({ variant = 'default' }: MessageNotificationEnvelopeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { chatNotifications, chatUnreadCount, markAsRead, markAllAsRead } = useNotifications();

  const handleNotificationClick = async (notificationId: string) => {
    await markAsRead(notificationId);
    // Navigate to chat conversation
    // This will be implemented based on your routing needs
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`relative ${variant === 'mobile' ? 'w-full justify-start' : 'hidden sm:flex'}`}
          onClick={() => setIsOpen(!isOpen)}
        >
          <Mail className={`h-4 w-4 ${variant === 'mobile' ? 'mr-3' : ''}`} />
          {variant === 'mobile' && 'Messages'}

          {/* Show unread count for chat notifications only */}
          {chatUnreadCount > 0 && (
            <Badge
              variant="secondary"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {chatUnreadCount > 99 ? '99+' : chatUnreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Messages</span>
          {chatUnreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllAsRead()}
              className="h-6 px-2 text-xs"
            >
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />

        {chatNotifications.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <Mail className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p>No new messages</p>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {chatNotifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`flex flex-col items-start p-3 cursor-pointer hover:bg-gray-50 ${
                  !notification.read ? 'bg-green-50 border-l-4 border-l-green-500' : ''
                }`}
                onClick={() => handleNotificationClick(notification.id)}
              >
                <div className="flex items-start justify-between w-full mb-1">
                  {/* 🆕 NEW: Show sender name instead of generic title */}
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {notification.senderName || 'Unknown Sender'}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(notification.lastMessageAt || notification.createdAt), { addSuffix: true })}
                  </span>
                </div>
                
                {/* 🆕 NEW: Show message preview instead of generic message */}
                <p className="text-sm text-gray-600">
                  {notification.messagePreview || notification.message}
                </p>
                
                {/* Show if unread */}
                {!notification.read && (
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2" />
                )}
              </DropdownMenuItem>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
