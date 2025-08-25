"use client";

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications } from '@/hooks/use-notifications';
import { useAuth } from '@/contexts/AuthContext';
import { X } from 'lucide-react';

interface ChatToastNotificationProps {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  duration?: number;
  soundEnabled?: boolean;
}

interface ToastNotification {
  id: string;
  title: string;
  message: string;
  senderName: string;
  timestamp: Date;
}

export function ChatToastNotification({ 
  position = 'bottom-right', 
  duration = 1000, 
  soundEnabled = true 
}: ChatToastNotificationProps) {
  const { chatNotifications } = useNotifications();
  const { user } = useAuth();
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const processedRef = useRef<Set<string>>(new Set());
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Create audio element for ding sound
  useEffect(() => {
    if (soundEnabled && typeof window !== 'undefined') {
      audioRef.current = new Audio();
      audioRef.current.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT';
      audioRef.current.volume = 0.3;
    }
  }, [soundEnabled]);

  // Play ding sound
  const playDingSound = () => {
    if (audioRef.current && soundEnabled) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {
        // Ignore audio play errors
      });
    }
  };

  // Process new chat notifications
  useEffect(() => {
    if (!user?.id || chatNotifications.length === 0) return;



    // Find unread notifications that haven't been processed yet
    const newUnreadNotifications = chatNotifications.filter(n => 
      !n.read && !processedRef.current.has(n.id)
    );
    

    
    if (newUnreadNotifications.length > 0) {
      // Process each new notification
      newUnreadNotifications.forEach(notification => {
        // Extract sender name from metadata or message
        let senderName = 'Someone';
        if (notification.metadata?.senderName) {
          senderName = notification.metadata.senderName;
        } else if (notification.message.includes('from ')) {
          senderName = notification.message.split('from ')[1];
        }

        // Create toast notification
        const newToast: ToastNotification = {
          id: notification.id,
          title: notification.title,
          message: notification.message,
          senderName,
          timestamp: new Date()
        };



        // Add to toasts array
        setToasts(prev => {
          // Prevent duplicate toasts
          const exists = prev.find(t => t.id === newToast.id);
          if (exists) {
    
            return prev;
          }
          
  
          return [...prev, newToast];
        });

        // Mark as processed using ref to avoid re-render issues
        processedRef.current.add(notification.id);

        // Play sound for new message
        playDingSound();

        // Auto-remove toast after duration
        const toastId = newToast.id;

        
        setTimeout(() => {
  
          setToasts(prev => {
            const filtered = prev.filter(t => t.id !== toastId);
    
            return filtered;
          });
        }, duration);
      });
    }
  }, [chatNotifications, user?.id, duration]);

  // Get position classes
  const getPositionClasses = () => {
    switch (position) {
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'top-right':
        return 'top-4 right-4';
      case 'top-left':
        return 'top-4 left-4';
      default:
        return 'bottom-4 right-4';
    }
  };

  // Remove toast manually
  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  if (!user) return null;

  return (
    <div className={`fixed z-50 ${getPositionClasses()}`}>
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.8 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="mb-3"
          >
            <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center mb-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                    <span className="text-sm font-medium text-gray-900">
                      {toast.senderName}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {toast.message}
                  </p>
                </div>
                
                <button
                  onClick={() => removeToast(toast.id)}
                  className="ml-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              
              <div className="text-xs text-gray-500">
                {toast.timestamp.toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
