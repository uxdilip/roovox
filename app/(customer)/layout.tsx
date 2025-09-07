"use client";

import { Header } from '@/components/layout/Header';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { ChatToastNotification } from '@/components/ui/chat-toast-notification';
import { useFCM } from '@/hooks/use-fcm';

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, activeRole, setActiveRole, roles } = useAuth() as any;
  const router = useRouter();

  // � Auto setup FCM for customer (always register now)
  useFCM({
    userId: user?.id,
    userType: 'customer',
    autoRegister: true
  });

  // 🔔 Ensure activeRole is always set to customer when in customer area
  useEffect(() => {
    if (user && roles?.includes('customer') && activeRole !== 'customer' && setActiveRole) {
      setActiveRole('customer');
    }
  }, [user, roles, activeRole, setActiveRole]);

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
      <ChatToastNotification position="bottom-right" duration={4000} soundEnabled={true} />
    </div>
  );
} 