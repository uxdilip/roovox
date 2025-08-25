"use client";

import React, { useState } from 'react';
import { Bell } from 'lucide-react';
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

interface BusinessNotificationBellProps {
  variant?: 'default' | 'mobile';
}

export function BusinessNotificationBell({ variant = 'default' }: BusinessNotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { businessNotifications, businessUnreadCount, markAsRead, markAllAsRead } = useNotifications();

  const handleNotificationClick = async (notificationId: string) => {
    await markAsRead(notificationId);
    // Handle navigation based on notification type
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
          <Bell className={`h-4 w-4 ${variant === 'mobile' ? 'mr-3' : ''}`} />
          {variant === 'mobile' && 'Business Notifications'}

          {/* Show unread count for business notifications only */}
          {businessUnreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {businessUnreadCount > 99 ? '99+' : businessUnreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Business Notifications</span>
          {businessUnreadCount > 0 && (
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

        {businessNotifications.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p>No business notifications yet</p>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {businessNotifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`flex flex-col items-start p-3 cursor-pointer hover:bg-gray-50 ${
                  !notification.read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                }`}
                onClick={() => handleNotificationClick(notification.id)}
              >
                <div className="flex items-start justify-between w-full mb-1">
                  <span className="font-medium text-sm">{notification.title}</span>
                  <span className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                
                {/* Show priority badge */}
                {notification.priority !== 'medium' && (
                  <Badge 
                    variant={notification.priority === 'urgent' ? 'destructive' : 'secondary'}
                    className="text-xs"
                  >
                    {notification.priority}
                  </Badge>
                )}
              </DropdownMenuItem>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
