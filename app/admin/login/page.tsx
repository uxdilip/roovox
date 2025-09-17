"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { account } from '@/lib/appwrite';
import { ID } from 'appwrite';

export default function AdminLoginPage() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState('');

  const { checkAdminStatus, isAuthenticated, setAdminUserAfterLogin } = useAdminAuth();
  const router = useRouter();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/admin');
    }
  }, [isAuthenticated, router]);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) {
      setError('Please enter your phone number');
      return;
    }

    // Validate phone number format (10 digits starting with 6-9)
    const phonePattern = /^[6-9]\d{9}$/;
    if (!phonePattern.test(phone)) {
      setError('Please enter a valid 10-digit Indian phone number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formattedPhone = `+91${phone}`;
      
      // Check if phone is authorized for admin access
      const adminCheck = await checkAdminStatus(formattedPhone);
      
      if (!adminCheck.isAdmin) {
        setError('Unauthorized phone number');
        setLoading(false);
        return;
      }

      // Send real OTP using Appwrite
      try { 
        await account.deleteSession('current'); 
      } catch (e) {
        console.log('No existing session to delete');
      }

      const token = await account.createPhoneToken(ID.unique(), formattedPhone);
      setUserId(token.userId);
      
      setStep('otp');
      setError('');
      
    } catch (error: any) {
      console.error('Error sending OTP:', error);
      if (error.message?.includes('Rate limit')) {
        setError('Too many requests. Please try again later.');
      } else {
        setError('Failed to send OTP. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) {
      setError('Please enter the OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Verify OTP with Appwrite
      await account.createSession(userId, otp);
      
      // Get session details
      const session = await account.get();

      // Create admin session in our context
      const formattedPhone = `+91${phone}`;
      const adminCheck = await checkAdminStatus(formattedPhone);
      
      if (adminCheck.isAdmin && adminCheck.adminUser) {
        // Update last login time in database
        try {
          const { databases, DATABASE_ID } = await import('@/lib/appwrite');
          await databases.updateDocument(
            DATABASE_ID,
            'admin_users',
            adminCheck.adminUser.id,
            {
              last_login: new Date().toISOString()
            }
          );
        } catch (updateError) {
          console.warn('Could not update last login time:', updateError);
        }

        // Update the admin user state and localStorage
        setAdminUserAfterLogin({
          ...adminCheck.adminUser,
          lastLogin: new Date().toISOString()
        });

        router.push('/admin');
      } else {
        setError('Admin access denied');
      }
      
    } catch (error: any) {
      console.error('Error verifying OTP:', error);
      if (error.message?.includes('Invalid token')) {
        setError('Invalid or expired OTP');
      } else if (error.message?.includes('expired')) {
        setError('OTP has expired. Please request a new one.');
      } else {
        setError('Invalid OTP. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBackToPhone = () => {
    setStep('phone');
    setOtp('');
    setUserId('');
    setError('');
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-full max-w-sm mx-auto px-6">
        {step === 'phone' ? (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-semibold text-gray-900">Admin Login</h1>
              <p className="text-gray-600">Enter your phone number</p>
            </div>

            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <Input
                type="tel"
                placeholder="10-digit phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                className="h-12 text-center"
                disabled={loading}
                autoFocus
              />

              {error && (
                <p className="text-sm text-red-600 text-center">{error}</p>
              )}

              <Button 
                type="submit" 
                className="w-full h-12"
                disabled={loading || !phone.trim()}
              >
                {loading ? 'Sending...' : 'Send OTP'}
              </Button>
            </form>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-semibold text-gray-900">Enter OTP</h1>
              <p className="text-gray-600">Code sent to +91 {phone}</p>
            </div>

            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <Input
                type="text"
                placeholder="6-digit code"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="h-12 text-center text-lg tracking-widest"
                maxLength={6}
                disabled={loading}
                autoFocus
              />

              {error && (
                <p className="text-sm text-red-600 text-center">{error}</p>
              )}

              <div className="space-y-3">
                <Button 
                  type="submit" 
                  className="w-full h-12"
                  disabled={loading || otp.length !== 6}
                >
                  {loading ? 'Verifying...' : 'Verify & Login'}
                </Button>

                <Button 
                  type="button" 
                  variant="ghost" 
                  className="w-full"
                  onClick={handleBackToPhone}
                  disabled={loading}
                >
                  ← Back
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
