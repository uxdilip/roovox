"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createCustomerProfile } from '@/lib/appwrite-services';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User, Phone, Mail } from 'lucide-react';

export default function CustomerOnboardingPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user, isLoading, refreshUserData } = useAuth();
  const router = useRouter();

  console.log('🎭 CustomerOnboardingPage render - user:', user, 'isLoading:', isLoading, 'user?.id:', user?.id);

  // Determine user type and pre-fill form
  const isGoogleUser = Boolean(user && user.name && user.email && (!user.phone || user.phone.trim() === ''));
  const isPhoneUser = Boolean(user && user.phone && user.phone.trim() !== '');

  useEffect(() => {
    if (user) {
      // Pre-fill form based on user type
      if (isGoogleUser) {
        setFullName(user.name || '');
        setEmail(user.email || '');
        setPhone('');
      } else if (isPhoneUser) {
        setFullName('');
        setEmail('');
        setPhone(user.phone || '');
      }
    }
  }, [user, isGoogleUser, isPhoneUser]);

  // Redirect if user is not logged in
  useEffect(() => {
    console.log('🔍 useEffect triggered - user:', user, 'isLoading:', isLoading);
    if (!isLoading && !user) {
      console.log('❌ No user found, redirecting to home');
      router.push('/');
    }
  }, [user, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validation based on user type
    if (isGoogleUser) {
      // Google user needs phone number
      if (!phone.trim()) {
        setError('Please enter your phone number');
        return;
      }
      
      // Basic phone validation
      const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
      if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
        setError('Please enter a valid phone number');
        return;
      }
    } else if (isPhoneUser) {
      // Phone user needs name and email
      if (!fullName.trim()) {
        setError('Please enter your full name');
        return;
      }

      if (!email.trim()) {
        setError('Please enter your email address');
        return;
      }

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setError('Please enter a valid email address');
        return;
      }
    }

    setLoading(true);
    try {
      if (!user) {
        throw new Error('User not found');
      }

      console.log('🆕 Creating customer profile for user:', user.id);
      
      // Create customer profile with available data
      const customerData = {
        user_id: user.id,
        full_name: isGoogleUser ? user.name : fullName.trim(),
        email: isGoogleUser ? user.email : email.trim(),
        phone: isGoogleUser ? phone.trim() : user.phone,
        address: ''
      };

      console.log('📝 Customer data to create:', customerData);
      
      // Create customer profile
      await createCustomerProfile(customerData);

      console.log('✅ Customer profile created successfully');
      
      // Refresh user data to get updated phone number
      await refreshUserData();
      
      // Redirect to dashboard
      router.push('/customer/dashboard');
      
    } catch (err: any) {
      console.error('❌ Error creating customer profile:', err);
      setError(err.message || 'Failed to create customer profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    console.log('⏳ Still loading, showing loading screen');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log('❌ No user found, showing loading screen (will redirect)');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  console.log('🎨 Rendering onboarding form for user:', user.id, 'isGoogleUser:', isGoogleUser, 'isPhoneUser:', isPhoneUser);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-lg">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold mb-2">Complete Your Profile</CardTitle>
            <p className="text-sm text-muted-foreground">
              {isGoogleUser 
                ? 'Please provide your phone number to complete your profile'
                : 'Please provide your details to complete your customer profile'
              }
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {/* Name field - read-only for Google users, editable for phone users */}
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-medium">
                  <User className="h-4 w-4 inline mr-2" />
                  Full Name
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  required={!isGoogleUser}
                  disabled={isGoogleUser}
                  className={`w-full ${isGoogleUser ? 'bg-gray-50' : ''}`}
                />
                {isGoogleUser && (
                  <p className="text-xs text-muted-foreground">
                    Name from Google account
                  </p>
                )}
              </div>

              {/* Email field - read-only for Google users, editable for phone users */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  <Mail className="h-4 w-4 inline mr-2" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required={!isGoogleUser}
                  disabled={isGoogleUser}
                  className={`w-full ${isGoogleUser ? 'bg-gray-50' : ''}`}
                />
                {isGoogleUser && (
                  <p className="text-xs text-muted-foreground">
                    Email from Google account
                  </p>
                )}
              </div>

              {/* Phone field - editable for Google users, read-only for phone users */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium">
                  <Phone className="h-4 w-4 inline mr-2" />
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter your phone number"
                  required={isGoogleUser}
                  disabled={isPhoneUser}
                  className={`w-full ${isPhoneUser ? 'bg-gray-50' : ''}`}
                />
                {isPhoneUser ? (
                  <p className="text-xs text-muted-foreground">
                    Phone number verified during login
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Please enter your phone number
                  </p>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading || (isGoogleUser ? !phone.trim() : (!fullName.trim() || !email.trim()))}
              >
                {loading ? 'Creating Profile...' : 'Complete Profile'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 