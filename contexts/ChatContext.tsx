"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { notificationService } from '@/lib/notifications';
import { useAuth } from './AuthContext';

interface ChatContextType {
  activeConversationId: string | null;
  isInChatTab: boolean;
  setActiveConversation: (conversationId: string | null) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const { user } = useAuth();
  const isInChatTab = pathname.includes('/chat');

  useEffect(() => {
    if (isInChatTab) {
      const urlParams = new URLSearchParams(window.location.search);
      const conversationId = urlParams.get('conversation') || urlParams.get('id');
      setActiveConversationId(conversationId);
      
      // 🔔 NEW: Track active chat session in database
      if (user?.id && conversationId) {
        notificationService.setActiveChatSession(user.id, conversationId, true);
        console.log(`🔔 [CHAT CONTEXT] Set active session: ${conversationId} for user ${user.id}`);
      }
    } else {
      // 🔔 NEW: Clear active session when leaving chat
      if (user?.id && activeConversationId) {
        notificationService.setActiveChatSession(user.id, null, false);
        console.log(`🔔 [CHAT CONTEXT] Cleared active session for user ${user.id}`);
      }
      setActiveConversationId(null);
    }
  }, [pathname, isInChatTab, user?.id, activeConversationId]);

  // 🔔 NEW: Update session when conversation changes
  useEffect(() => {
    if (user?.id) {
      notificationService.setActiveChatSession(user.id, activeConversationId, !!activeConversationId);
      console.log(`🔔 [CHAT CONTEXT] Updated session: ${activeConversationId} (active: ${!!activeConversationId}) for user ${user.id}`);
    }
  }, [activeConversationId, user?.id]);

  const setActiveConversation = (conversationId: string | null) => {
    setActiveConversationId(conversationId);
  };

  return (
    <ChatContext.Provider value={{ activeConversationId, isInChatTab, setActiveConversation }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
