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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const router = useRouter();

  // Redirect if user is not logged in
  useEffect(() => {
    if (!user) {
      router.push('/');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
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

    setLoading(true);
    try {
      if (!user) {
        throw new Error('User not found');
      }

      console.log('🆕 Creating customer profile for user:', user.id);
      
      // Create customer profile
      await createCustomerProfile({
        user_id: user.id,
        full_name: fullName.trim(),
        email: email.trim(),
        phone: user.phone || '',
        address: '' // Removed address from profile creation
      });

      console.log('✅ Customer profile created successfully');
      
      // Redirect to dashboard
      router.push('/customer/dashboard');
      
    } catch (err: any) {
      console.error('❌ Error creating customer profile:', err);
      setError(err.message || 'Failed to create customer profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-lg">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold mb-2">Complete Your Profile</CardTitle>
            <p className="text-sm text-muted-foreground">
              Please provide your details to complete your customer profile
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
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
                  required
                  className="w-full"
                />
              </div>

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
                  required
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium">
                  <Phone className="h-4 w-4 inline mr-2" />
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={user.phone || ''}
                  disabled
                  className="w-full bg-gray-50"
                />
                <p className="text-xs text-muted-foreground">
                  Phone number verified during login
                </p>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading || !fullName.trim() || !email.trim()}
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