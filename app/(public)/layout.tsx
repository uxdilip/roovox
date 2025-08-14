"use client";

import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function PublicLayout({
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
      }
      // Don't redirect customers - let them stay on home page if they want
      // They can access "My Bookings" from the header menu
    }
  }, [user, isLoading, activeRole, router]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
} 