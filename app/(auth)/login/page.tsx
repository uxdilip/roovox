"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import LoginModal from '@/components/auth/LoginModal';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showModal, setShowModal] = useState(false);
  const returnUrl = searchParams.get('returnUrl');

  useEffect(() => {
    // Show the login modal instead of redirecting
    setShowModal(true);
  }, []);

  const handleModalClose = (open: boolean) => {
    if (!open) {
      // If modal is closed without login, redirect to home
      router.replace('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading login...</p>
      </div>
      
      <LoginModal 
        open={showModal} 
        onOpenChange={handleModalClose}
        returnUrl={returnUrl || undefined}
      />
    </div>
  );
}