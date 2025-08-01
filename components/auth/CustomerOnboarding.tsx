"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createCustomerProfile } from '@/lib/appwrite-services';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { User, Phone, Mail } from 'lucide-react';

interface CustomerOnboardingProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userPhone: string;
}

export default function CustomerOnboarding({ open, onOpenChange, userPhone }: CustomerOnboardingProps) {
  console.log('🎭 CustomerOnboarding render - open:', open, 'userPhone:', userPhone);
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const router = useRouter();

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

      // Create customer profile
      await createCustomerProfile({
        user_id: user.id,
        full_name: fullName.trim(),
        email: email.trim(),
        phone: userPhone,
        address: ''
      });

      // Close modal and redirect to dashboard
      onOpenChange(false);
      router.push('/customer/dashboard');
      
    } catch (err: any) {
      setError(err.message || 'Failed to create customer profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      console.log('🎭 Dialog onOpenChange called with:', newOpen);
      onOpenChange(newOpen);
    }}>
      <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl shadow-2xl bg-white/80 backdrop-blur-lg">
        <div className="p-6">
          <Card className="shadow-none border-0 bg-transparent">
            <CardHeader className="mb-4 p-0">
              <CardTitle className="text-2xl font-bold mb-2 text-center">Complete Your Profile</CardTitle>
              <p className="text-sm text-muted-foreground text-center">
                Please provide your details to complete your customer profile
              </p>
            </CardHeader>
            <CardContent className="p-0">
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
                    value={userPhone}
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
      </DialogContent>
    </Dialog>
  );
} 