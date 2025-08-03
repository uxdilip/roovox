"use client";

import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';

export default function ProviderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, activeRole, setActiveRole, roles } = useAuth();
  const router = useRouter();
  
  // Ensure activeRole is set to 'provider' when on any provider page
  useEffect(() => {
    if (user && roles.includes('provider') && activeRole !== 'provider' && setActiveRole) {
      console.log('🔍 ProviderLayout: Setting activeRole to provider');
      setActiveRole('provider');
    }
  }, [user, roles, activeRole, setActiveRole]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
} 