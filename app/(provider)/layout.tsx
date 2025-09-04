"use client";

import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { ChatToastNotification } from '@/components/ui/chat-toast-notification';

export default function ProviderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, activeRole, setActiveRole, roles, isLoading } = useAuth();
  const router = useRouter();
  
  // Ensure activeRole is set to 'provider' when on any provider page
  useEffect(() => {
    if (user && roles.includes('provider') && activeRole !== 'provider' && setActiveRole) {
  
      setActiveRole('provider');
    }
  }, [user, roles, activeRole, setActiveRole]);

  // Route guard: Redirect non-provider users to appropriate pages
  useEffect(() => {
    // Wait for authentication to finish loading before making redirect decisions
    if (isLoading) {
      return; // Don't redirect while still loading
    }
    
    if (!user) {
      // Not logged in, redirect to login
      router.replace('/provider/login');
    } else if (user && !roles.includes('provider')) {
      // User is not a provider, redirect to customer area
      router.replace('/');
    }
  }, [user, roles, router, isLoading]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      {/* Chat notifications for provider pages */}
      <ChatToastNotification position="bottom-right" duration={4000} soundEnabled={true} />
    </div>
  );
} 