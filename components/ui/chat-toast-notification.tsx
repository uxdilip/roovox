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
  
  // Track last processed time per notification id (for initial create spam control)
  const recentlyProcessedRef = useRef<Map<string, number>>(new Map()); // ID -> timestamp
  // Track last shown version (lastMessageAt or messagePreview hash) per notification id to allow toasts on updates
  const processedVersionRef = useRef<Map<string, string>>(new Map()); // ID -> versionKey
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // 🆕 NEW: Session tracking to prevent showing old notifications on page reload
  const sessionStartTime = useRef<number>(Date.now());
  
  // 🆕 NEW: Persistent storage keys
  const STORAGE_KEY_SHOWN_TOASTS = 'sniket_shown_toasts';
  const STORAGE_KEY_SESSION_START = 'sniket_session_start';
  
  // 🆕 NEW: Load persistent state on mount
  useEffect(() => {
    try {
      // Check if this is a fresh session or continuing session
      const storedSessionStart = localStorage.getItem(STORAGE_KEY_SESSION_START);
      const now = Date.now();
      
      if (storedSessionStart) {
        const lastSessionStart = parseInt(storedSessionStart);
        const timeSinceLastSession = now - lastSessionStart;
        
        // If less than 10 minutes since last session, continue the session
        if (timeSinceLastSession < 10 * 60 * 1000) {
          sessionStartTime.current = lastSessionStart;
          
          // Load previously shown toasts
          const storedShownToasts = localStorage.getItem(STORAGE_KEY_SHOWN_TOASTS);
          if (storedShownToasts) {
            const shownToasts = JSON.parse(storedShownToasts);
            // Only keep toasts from the last hour
            const oneHourAgo = now - (60 * 60 * 1000);
            
            Object.entries(shownToasts).forEach(([id, data]: [string, any]) => {
              if (data.timestamp > oneHourAgo) {
                processedVersionRef.current.set(id, data.versionKey);
                recentlyProcessedRef.current.set(id, data.timestamp);
              }
            });
          }
        } else {
          // Fresh session - clear old data
          sessionStartTime.current = now;
          localStorage.removeItem(STORAGE_KEY_SHOWN_TOASTS);
        }
      } else {
        // First session
        sessionStartTime.current = now;
      }
      
      // Update session start time
      localStorage.setItem(STORAGE_KEY_SESSION_START, sessionStartTime.current.toString());
      
    } catch (error) {
      // Error loading persistent state - continue with fresh session
      sessionStartTime.current = Date.now();
    }
  }, []);



  // 🔔 FIXED: Clean up old processed entries periodically (keep only last 5 minutes)
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      const fiveMinutesAgo = now - (5 * 60 * 1000);
      
      // Clean up in-memory refs
      recentlyProcessedRef.current.forEach((timestamp, id) => {
        if (timestamp < fiveMinutesAgo) {
          recentlyProcessedRef.current.delete(id);
        }
      });
      
      // 🆕 NEW: Clean up localStorage as well
      try {
        const storedShownToasts = localStorage.getItem(STORAGE_KEY_SHOWN_TOASTS);
        if (storedShownToasts) {
          const shownToasts = JSON.parse(storedShownToasts);
          const oneHourAgo = now - (60 * 60 * 1000); // Keep toasts for 1 hour
          
          let hasChanges = false;
          Object.keys(shownToasts).forEach(id => {
            if (shownToasts[id].timestamp < oneHourAgo) {
              delete shownToasts[id];
              hasChanges = true;
            }
          });
          
          if (hasChanges) {
            localStorage.setItem(STORAGE_KEY_SHOWN_TOASTS, JSON.stringify(shownToasts));
          }
        }
      } catch (error) {
        // Error cleaning localStorage - continue silently
      }
    }, 60000); // Clean up every minute

    return () => clearInterval(cleanupInterval);
  }, []);

  // 🔔 FIXED: Mark notification as recently processed (with timestamp)
  const markAsRecentlyProcessed = (notificationId: string) => {
    recentlyProcessedRef.current.set(notificationId, Date.now());
  };
  
  // 🆕 NEW: Save shown toast to persistent storage
  const saveShownToast = (notificationId: string, versionKey: string) => {
    try {
      const storedShownToasts = localStorage.getItem(STORAGE_KEY_SHOWN_TOASTS);
      const shownToasts = storedShownToasts ? JSON.parse(storedShownToasts) : {};
      
      shownToasts[notificationId] = {
        versionKey,
        timestamp: Date.now()
      };
      
      localStorage.setItem(STORAGE_KEY_SHOWN_TOASTS, JSON.stringify(shownToasts));
    } catch (error) {
      // Error saving shown toast - continue silently
    }
  };
  
  // 🆕 NEW: Check if notification is recent enough to show as toast
  const isRecentEnoughForToast = (notification: any): boolean => {
    const now = Date.now();
    
    // Use lastMessageAt (for grouped chat notifications) or createdAt as fallback
    const notificationTime = new Date(notification.lastMessageAt || notification.createdAt).getTime();
    
    // Only show toasts for notifications that are:
    // 1. Newer than session start time, OR
    // 2. Within the last 10 minutes (for real-time notifications)
    const tenMinutesAgo = now - (10 * 60 * 1000);
    const isAfterSessionStart = notificationTime >= sessionStartTime.current;
    const isWithinTenMinutes = notificationTime >= tenMinutesAgo;
    
    // Show if it's after session start OR within last 10 minutes
    return isAfterSessionStart || isWithinTenMinutes;
  };

  // Build a version key for a notification to detect meaningful content change
  const buildVersionKey = (n: any) => {
    // Prefer lastMessageAt (chat grouping) + messagePreview/content fallback
    return `${n.lastMessageAt || n.createdAt}_${n.messagePreview || n.message || ''}`;
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
        // Could not create audio context - continue without sound
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
        // Could not play sound - continue silently
      }
    }
  };

  // Process new chat notifications
  useEffect(() => {
    if (!user?.id || chatNotifications.length === 0) {
      return;
    }

    // 🆕 FIXED: Filter notifications by time before processing
    const candidateNotifications = chatNotifications.filter(notification => {
      const isRecent = isRecentEnoughForToast(notification);
      
      return isRecent;
    });

    if (candidateNotifications.length === 0) {
      return;
    }

    candidateNotifications.forEach(notification => {
      const versionKey = buildVersionKey(notification);
      const previousVersion = processedVersionRef.current.get(notification.id);
      const isNewVersion = previousVersion !== versionKey;

      // Show toast if: first time (no previousVersion) OR content changed (new version)
      if (!previousVersion || isNewVersion) {
        // Still check skipToast flag for explicit suppression
        if ((notification as any).skipToast) {
          // Still track as processed to avoid showing later
          processedVersionRef.current.set(notification.id, versionKey);
          markAsRecentlyProcessed(notification.id);
          saveShownToast(notification.id, versionKey);
          return;
        }

        const senderName = notification.senderName || 'Someone';
        const messagePreview = notification.messagePreview || notification.message;

        const newToast: ToastNotification = {
          id: notification.id + '_' + versionKey, // unique per version for rendering
          title: `${senderName}: ${messagePreview}`,
          message: messagePreview,
          senderName,
            timestamp: new Date()
        };

        setToasts(prev => [...prev, newToast]);
        processedVersionRef.current.set(notification.id, versionKey);
        markAsRecentlyProcessed(notification.id); // base id for spam control
        saveShownToast(notification.id, versionKey); // 🆕 NEW: Save to persistent storage
        playDingSound();

        const toastId = newToast.id;
        setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== toastId));
        }, duration);
      } else {
        // Notification already processed or no content change
      }
    });
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
