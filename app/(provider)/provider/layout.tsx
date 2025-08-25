"use client";

import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function ProviderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, activeRole, setActiveRole, roles } = useAuth();
  
  // Ensure activeRole is set to 'provider' when on any provider page
  useEffect(() => {
    if (user && roles.includes('provider') && activeRole !== 'provider' && setActiveRole) {
      setActiveRole('provider');
    }
  }, [user, roles, activeRole, setActiveRole]);

  return (
    <main className="flex-1 bg-gray-50 min-h-screen">
        {children}
      </main>
  );
}