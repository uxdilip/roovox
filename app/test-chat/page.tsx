"use client";

import React, { useState, useEffect } from 'react';
import { databases, DATABASE_ID, client } from '@/lib/appwrite';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ChatTestPage() {
  const [status, setStatus] = useState('Testing...');
  const [conversations, setConversations] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [testMessage, setTestMessage] = useState('Hello World Test');

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    try {
      setStatus('Testing Appwrite connection...');
      
      // Test database connection
      const collections = await databases.listCollections(DATABASE_ID);
      setStatus(`✅ Connected! Found ${collections.collections.length} collections`);
      
      // Test conversations collection
      try {
        const convResult = await databases.listDocuments(DATABASE_ID, 'conversations');
        setConversations(convResult.documents);
        setStatus(prev => prev + `\n📂 Conversations: ${convResult.documents.length}`);
      } catch (err) {
        setStatus(prev => prev + `\n❌ Conversations error: ${err}`);
      }
      
      // Test messages collection
      try {
        const msgResult = await databases.listDocuments(DATABASE_ID, 'messages');
        setMessages(msgResult.documents);
        setStatus(prev => prev + `\n💬 Messages: ${msgResult.documents.length}`);
      } catch (err) {
        setStatus(prev => prev + `\n❌ Messages error: ${err}`);
      }
      
      // Test real-time connection
      try {
        const unsubscribe = client.subscribe(
          `databases.${DATABASE_ID}.collections.messages.documents`,
          (response) => {
            setStatus(prev => prev + `\n🔄 Real-time event received: ${response.events[0]}`);
          }
        );
        
        setTimeout(() => {
          unsubscribe();
          setStatus(prev => prev + `\n✅ Real-time test completed`);
        }, 2000);
      } catch (err) {
        setStatus(prev => prev + `\n❌ Real-time error: ${err}`);
      }
      
    } catch (error) {
      setStatus(`❌ Connection failed: ${error}`);
    }
  };

  const testSendMessage = async () => {
    if (!testMessage.trim()) return;
    
    try {
      setStatus(prev => prev + `\n📤 Sending test message...`);
      
      // Create a test message
      const result = await databases.createDocument(
        DATABASE_ID,
        'messages',
        'unique()',
        {
          conversation_id: 'test-conversation',
          sender_id: 'test-user',
          sender_type: 'customer',
          message_type: 'text',
          content: testMessage,
          created_at: new Date().toISOString()
        }
      );
      
      setStatus(prev => prev + `\n✅ Message sent! ID: ${result.$id}`);
      setTestMessage('');
      
      // Refresh messages
      setTimeout(() => {
        testConnection();
      }, 1000);
      
    } catch (error) {
      setStatus(prev => prev + `\n❌ Send failed: ${error}`);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Chat System Test Page</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg font-semibold mb-2">Connection Status</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm whitespace-pre-wrap h-64 overflow-y-auto">
            {status}
          </pre>
          <Button onClick={testConnection} className="mt-2">
            Refresh Test
          </Button>
        </div>
        
        <div>
          <h2 className="text-lg font-semibold mb-2">Test Message Send</h2>
          <div className="space-y-2">
            <Input
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              placeholder="Enter test message"
            />
            <Button onClick={testSendMessage} disabled={!testMessage.trim()}>
              Send Test Message
            </Button>
          </div>
          
          <h3 className="text-md font-semibold mt-4 mb-2">Recent Messages</h3>
          <div className="bg-gray-50 p-2 rounded h-32 overflow-y-auto">
            {messages.slice(-5).map((msg, idx) => (
              <div key={idx} className="text-sm mb-1">
                <strong>{msg.sender_type}:</strong> {msg.content}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-2">Conversations ({conversations.length})</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {conversations.slice(0, 6).map((conv, idx) => (
            <div key={idx} className="bg-blue-50 p-2 rounded text-sm">
              <div><strong>ID:</strong> {conv.$id.substring(0, 8)}...</div>
              <div><strong>Customer:</strong> {conv.customer_id?.substring(0, 8)}...</div>
              <div><strong>Provider:</strong> {conv.provider_id?.substring(0, 8)}...</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}