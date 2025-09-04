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
  duration = 4000,
  soundEnabled = true 
}: ChatToastNotificationProps) {
  const { chatNotifications } = useNotifications();
  const { user } = useAuth();
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const recentlyProcessedRef = useRef<Map<string, number>>(new Map()); // ID -> timestamp
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 🔔 DEBUG: Log component mount and props
  useEffect(() => {
    console.log('🔔 [TOAST COMPONENT] Mounted with props:', { position, duration, soundEnabled });
    console.log('🔔 [TOAST COMPONENT] User:', user?.id);
  }, []);

  // 🔔 DEBUG: Log when chatNotifications change
  useEffect(() => {
    console.log('🔔 [TOAST COMPONENT] Chat notifications changed:', chatNotifications.length);
  }, [chatNotifications]);

  // 🔔 FIXED: Clean up old processed entries periodically (keep only last 5 minutes)
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      const fiveMinutesAgo = now - (5 * 60 * 1000);
      
      recentlyProcessedRef.current.forEach((timestamp, id) => {
        if (timestamp < fiveMinutesAgo) {
          recentlyProcessedRef.current.delete(id);
        }
      });
    }, 60000); // Clean up every minute

    return () => clearInterval(cleanupInterval);
  }, []);

  // 🔔 FIXED: Mark notification as recently processed (with timestamp)
  const markAsRecentlyProcessed = (notificationId: string) => {
    recentlyProcessedRef.current.set(notificationId, Date.now());
  };

  // 🔔 FIXED: Check if notification was recently processed (within 10 seconds)
  const wasRecentlyProcessed = (notificationId: string): boolean => {
    const processedTime = recentlyProcessedRef.current.get(notificationId);
    if (!processedTime) return false;
    
    const now = Date.now();
    const tenSecondsAgo = now - (10 * 1000); // 🔔 REDUCED to 10 seconds
    
    return processedTime > tenSecondsAgo;
  };

  // Create audio element for ding sound
  useEffect(() => {
    if (soundEnabled && typeof window !== 'undefined') {
      try {
        audioRef.current = new Audio();
        // 🔔 FIXED: Use a simple beep sound instead of invalid base64
        // This creates a simple beep using Web Audio API
        const createBeepSound = () => {
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.frequency.value = 800; // 800 Hz beep
          gainNode.gain.setValueAtTime(0, audioContext.currentTime);
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + 0.01);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
          
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.5);
        };
        
        // Store the beep function instead of Audio object
        (audioRef.current as any) = { play: createBeepSound };
      } catch (error) {
        console.warn('🔔 [AUDIO] Could not create audio context:', error);
        audioRef.current = null;
      }
    }
  }, [soundEnabled]);

  // Play ding sound
  const playDingSound = () => {
    if (audioRef.current && soundEnabled) {
      try {
        if (typeof (audioRef.current as any).play === 'function') {
          (audioRef.current as any).play();
        }
      } catch (error) {
        console.warn('🔔 [AUDIO] Could not play sound:', error);
      }
    }
  };

  // Process new chat notifications
  useEffect(() => {
    if (!user?.id || chatNotifications.length === 0) {
      console.log('🔔 [TOAST DEBUG] Early return:', { userId: user?.id, notificationCount: chatNotifications.length });
      return;
    }

    console.log('🔔 [TOAST DEBUG] Processing notifications:', {
      userId: user?.id,
      totalNotifications: chatNotifications.length,
      notifications: chatNotifications.map(n => ({
        id: n.id,
        senderName: n.senderName,
        skipToast: (n as any).skipToast,
        createdAt: n.createdAt,
        lastMessageAt: n.lastMessageAt,
        read: n.read
      }))
    });

    // 🔔 TEMPORARILY SIMPLIFIED: Show toast for ALL unread chat notifications
    const unreadNotifications = chatNotifications.filter(n => !n.read);
    
    console.log('🔔 [TOAST DEBUG] Unread notifications:', unreadNotifications.length);
    
    if (unreadNotifications.length > 0) {
      // Process each unread notification
      unreadNotifications.forEach(notification => {
        console.log('🔔 [TOAST DEBUG] Processing unread notification:', {
          id: notification.id,
          skipToast: (notification as any).skipToast,
          senderName: notification.senderName,
          wasRecentlyProcessed: wasRecentlyProcessed(notification.id)
        });

        // Skip if recently processed (to avoid spam)
        if (wasRecentlyProcessed(notification.id)) {
          console.log('🔔 [TOAST DEBUG] Skipping recently processed:', notification.id);
          return;
        }

        // 🔔 FIXED: Check if this notification should skip toast (when user is actively viewing that chat)
        if ((notification as any).skipToast) {
          console.log('🔔 [TOAST DEBUG] Skipping toast due to skipToast flag:', notification.id);
          // Mark as processed but don't show toast
          markAsRecentlyProcessed(notification.id);
          return;
        }

        // 🔔 FIXED: Use Fiverr-style fields for better content
        const senderName = notification.senderName || 'Someone';
        const messagePreview = notification.messagePreview || notification.message;

        console.log('🔔 [TOAST DEBUG] Creating toast for:', { senderName, messagePreview });

        // Create toast notification with Fiverr-style format
        const newToast: ToastNotification = {
          id: notification.id,
          title: `${senderName}: ${messagePreview}`,
          message: messagePreview,
          senderName: senderName,
          timestamp: new Date()
        };

        // Add to toasts array
        setToasts(prev => {
          // Prevent duplicate toasts
          const exists = prev.find(t => t.id === newToast.id);
          if (exists) {
            console.log('🔔 [TOAST DEBUG] Toast already exists:', newToast.id);
            return prev;
          }
          
          console.log('🔔 [TOAST DEBUG] Adding new toast:', newToast.id);
          return [...prev, newToast];
        });

        // 🔔 FIXED: Mark as processed with timestamp
        markAsRecentlyProcessed(notification.id);

        // Play sound for new message
        playDingSound();

        // Auto-remove toast after duration
        const toastId = newToast.id;
        
        setTimeout(() => {
          console.log('🔔 [TOAST DEBUG] Removing toast after timeout:', toastId);
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
