"use client";

import { Header } from '@/components/layout/Header';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { ChatToastNotification } from '@/components/ui/chat-toast-notification';

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, activeRole } = useAuth();
  const router = useRouter();

  // Route guard: Redirect authenticated users to appropriate pages
  useEffect(() => {
    if (!isLoading && user) {
      if (activeRole === 'provider') {
        // Provider logged in, redirect to provider dashboard
        router.replace('/provider/dashboard');
      } else if (activeRole === 'customer') {
        // Customer logged in, check if they need onboarding
        // This will be handled by the individual pages or AuthContext
        // For now, just ensure they're not on onboarding if completed
      }
    }
  }, [user, isLoading, activeRole, router]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      {/* Chat notifications for customer pages */}
      <ChatToastNotification position="bottom-right" duration={1000} soundEnabled={true} />
    </div>
  );
} 