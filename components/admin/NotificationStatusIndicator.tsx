"use client";

import React from 'react';
import { Bell, BellOff, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { NotificationStatus } from './NotificationBanner';

interface NotificationStatusIndicatorProps {
  status: NotificationStatus;
  onClick?: () => void;
}

export default function NotificationStatusIndicator({ status, onClick }: NotificationStatusIndicatorProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'checking':
        return {
          icon: <Clock className="h-4 w-4 animate-spin" />,
          color: 'text-gray-500',
          badge: null,
          tooltip: 'Checking notification status...'
        };

      case 'enabled':
        return {
          icon: <Bell className="h-4 w-4" />,
          color: 'text-green-600',
          badge: <Badge variant="secondary" className="ml-1 bg-green-100 text-green-700 text-xs px-1.5 py-0.5">ON</Badge>,
          tooltip: 'Notifications enabled - You\'ll receive alerts for unresponded customer messages'
        };

      case 'disabled':
        return {
          icon: <BellOff className="h-4 w-4" />,
          color: 'text-orange-600',
          badge: <Badge variant="secondary" className="ml-1 bg-orange-100 text-orange-700 text-xs px-1.5 py-0.5">OFF</Badge>,
          tooltip: 'Notifications disabled - Click to enable alerts for unresponded messages'
        };

      case 'denied':
        return {
          icon: <BellOff className="h-4 w-4" />,
          color: 'text-red-600',
          badge: <Badge variant="destructive" className="ml-1 text-xs px-1.5 py-0.5">!</Badge>,
          tooltip: 'Notification permission denied - Please allow notifications in browser settings'
        };

      case 'error':
        return {
          icon: <BellOff className="h-4 w-4" />,
          color: 'text-gray-600',
          badge: <Badge variant="secondary" className="ml-1 bg-gray-100 text-gray-700 text-xs px-1.5 py-0.5">ERR</Badge>,
          tooltip: 'Notification setup error - Click to try again'
        };

      default:
        return {
          icon: <BellOff className="h-4 w-4" />,
          color: 'text-gray-500',
          badge: null,
          tooltip: 'Notifications'
        };
    }
  };

  const config = getStatusConfig();
  const isClickable = status !== 'checking' && status !== 'enabled';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={`flex items-center gap-1 ${config.color} ${isClickable ? 'hover:bg-gray-100 cursor-pointer' : 'cursor-default'}`}
            onClick={isClickable ? onClick : undefined}
          >
            {config.icon}
            {config.badge}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" align="end">
          <p className="text-sm max-w-xs">{config.tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
