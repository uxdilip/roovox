"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, MessageSquare, User } from 'lucide-react';
import { realtimeChat } from '@/lib/realtime-chat';
import { formatDistanceToNow } from 'date-fns';

interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_type: 'customer' | 'provider';
  message_type: 'text' | 'quote_request' | 'offer';
  content: string;
  metadata?: any;
  created_at: string;
}

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
  customerName: string;
  providerName: string;
}

export function ChatModal({ 
  isOpen, 
  onClose, 
  conversationId, 
  customerName, 
  providerName 
}: ChatModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && conversationId) {
      loadMessages();
    }
  }, [isOpen, conversationId]);

  const loadMessages = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await realtimeChat.getMessages(conversationId, 100);
      
      if (result.success && result.messages) {
        // Sort messages reverse chronologically (newest first for chat display)
        const sortedMessages = result.messages.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setMessages(sortedMessages);
      } else {
        setError(result.error || 'Failed to load messages');
      }
    } catch (err) {
      setError('Error loading chat messages');
      console.error('Error loading messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const MessageBubble = ({ message }: { message: ChatMessage }) => {
    const isCustomer = message.sender_type === 'customer';
    
    return (
      <div className={`flex mb-6 ${isCustomer ? 'justify-start' : 'justify-end'} items-end gap-3`}>
        {isCustomer && (
          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-slate-600" />
          </div>
        )}
        
        <div className={`max-w-[75%] ${isCustomer ? '' : 'text-right'}`}>
          {/* Sender name and time */}
          <div className={`text-xs text-slate-500 mb-1 ${isCustomer ? 'text-left' : 'text-right'}`}>
            <span className="font-medium">
              {isCustomer ? customerName : providerName}
            </span>
            <span className="ml-2">
              {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
            </span>
          </div>
          
          {/* Message bubble */}
          <div className={`inline-block px-4 py-3 rounded-2xl shadow-sm ${
            isCustomer 
              ? 'bg-slate-100 text-slate-900 rounded-bl-md' 
              : 'bg-blue-500 text-white rounded-br-md'
          }`}>
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
              {message.content}
            </p>
          </div>
        </div>
        
        {!isCustomer && (
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
            <MessageSquare className="w-4 h-4 text-white" />
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full h-[85vh] flex flex-col p-0 gap-0">
        {/* Header */}
        <div className="flex items-center gap-3 p-6 border-b bg-white rounded-t-lg">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Chat Conversation</h2>
            <p className="text-sm text-slate-500">
              {customerName} ↔ {providerName}
            </p>
          </div>
        </div>

        {/* Messages Area - Fixed height with scroll */}
        <div className="flex-1 overflow-hidden bg-slate-50">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3"></div>
                <p className="text-sm text-slate-600">Loading messages...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
                  <X className="w-8 h-8 text-red-500" />
                </div>
                <p className="font-medium text-slate-900 mb-1">Error loading chat</p>
                <p className="text-sm text-slate-600 mb-4">{error}</p>
                <Button variant="outline" size="sm" onClick={loadMessages}>
                  Try Again
                </Button>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center mx-auto mb-3">
                  <MessageSquare className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-lg font-medium text-slate-900 mb-1">No messages yet</p>
                <p className="text-sm text-slate-500">This conversation hasn't started</p>
              </div>
            </div>
          ) : (
            <ScrollArea className="h-full">
              <div className="p-6 space-y-4">
                {messages.map((message) => (
                  <MessageBubble key={message.id} message={message} />
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center p-6 bg-white border-t">
          <div className="text-sm text-slate-500">
            <span className="font-medium">{messages.length}</span> messages • Read-only view
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
