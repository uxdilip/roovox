"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getProviderByUserId } from '@/lib/appwrite-services';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { account } from '@/lib/appwrite';

export default function ProviderLoginPage() {
  const { user, roles, isLoading, loginWithPhoneOtp } = useAuth();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [userId, setUserId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const router = useRouter();

  // Redirect if already logged in as provider
  useEffect(() => {
    if (!isLoading && user && roles.includes('provider')) {
      router.replace('/provider/dashboard');
    }
  }, [user, roles, isLoading, router]);

  // Helper function to check if onboarding is completed
  const checkOnboardingCompletion = async (userId: string) => {
    try {
      // First check if user exists in users collection
      const { databases } = await import('@/lib/appwrite');
      const { DATABASE_ID } = await import('@/lib/appwrite');
      const { Query } = await import('appwrite');
      
      // Use 'user_id' for lookup, not '$id'
      const userResponse = await databases.listDocuments(
        DATABASE_ID,
        'User',
        [Query.equal('user_id', userId), Query.limit(1)]
      );
      
      // If user doesn't exist in users collection, they're definitely new
      if (userResponse.documents.length === 0) {
        console.log('User not found in users collection, new user detected');
        return false;
      }
      
      // Now check business_setup document for onboarding completion
      const businessResponse = await databases.listDocuments(
        DATABASE_ID,
        'business_setup',
        [Query.equal('user_id', userId), Query.limit(1)]
      );
      if (businessResponse.documents.length > 0) {
        const businessData = JSON.parse(businessResponse.documents[0].onboarding_data || '{}');
        // Check for meaningful onboarding data (personalDetails, businessInfo, serviceSetup, serviceSelection, payment)
        const hasPersonalDetails = !!businessData.personalDetails?.fullName;
        const hasBusinessInfo = !!businessData.businessInfo?.businessName;
        const hasServiceSetup = !!businessData.serviceSetup?.location;
        const hasServiceSelection = !!(
          (businessData.serviceSelection?.phone?.brands?.length > 0) ||
          (businessData.serviceSelection?.laptop?.brands?.length > 0)
        );
        const hasPayment = !!businessData.upi;
        const isOnboardingCompleted = Boolean(hasPersonalDetails && hasBusinessInfo && hasServiceSetup && hasServiceSelection && hasPayment);
        if (isOnboardingCompleted) {
          console.log('Business setup data found, onboarding completed');
          return true;
        }
      }
      
      console.log('No completed onboarding data found for user:', userId);
      return false;
    } catch (error) {
      console.error('Error checking onboarding completion:', error);
      return false;
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const phonePattern = /^[6-9]\d{9}$/;
    if (!phonePattern.test(phone)) {
      setError('Please enter a valid 10-digit Indian phone number');
      return;
    }
    setLoading(true);
    try {
      const result = await loginWithPhoneOtp('+91' + phone);
      if (result && result.userId) {
        setUserId(result.userId);
        setStep('otp');
      } else {
        setError('Failed to send OTP');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await loginWithPhoneOtp('+91' + phone, otp, userId);
      
      // Check if onboarding is completed after successful login
      const checkOnboardingStatus = async () => {
        try {
          // Get the current user from the session
          const { account } = await import('@/lib/appwrite');
          const session = await account.get();
          
          if (!session) {
            console.log('No session found, redirecting to onboarding');
            router.push('/provider/onboarding');
            return;
          }
          
          console.log('Checking onboarding status for user:', session.$id);
          const isOnboardingCompleted = await checkOnboardingCompletion(session.$id);
          
          if (isOnboardingCompleted) {
            console.log('Onboarding completed, redirecting to dashboard');
            router.push('/provider/dashboard');
          } else {
            console.log('Onboarding not completed, redirecting to onboarding');
            router.push('/provider/onboarding');
          }
        } catch (error) {
          console.error('Error checking onboarding status:', error);
          // If there's an error checking, assume onboarding is not completed
          router.push('/provider/onboarding');
        }
      };
      
      // Wait a bit for the auth context to update, then check onboarding
      setTimeout(checkOnboardingStatus, 1000);
      
    } catch (err: any) {
      setError(err.message || 'Failed to verify OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    localStorage.setItem('loginAsProvider', '1');
    const successUrl = window.location.origin + '/provider/dashboard';
    const failureUrl = window.location.origin + '/provider/login?error=oauth';
    account.createOAuth2Session('google' as any, successUrl, failureUrl);
  };

  return (
    <Dialog open={true} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-2xl shadow-2xl bg-white/80 backdrop-blur-lg">
        <div className="flex flex-col md:flex-row">
          <div className="hidden md:flex flex-col justify-center items-center bg-muted w-1/2 p-8">
            <img src="/assets/undraw_access-account_aydp.svg" alt="Provider Login Illustration" className="w-72 h-72 object-contain" />
          </div>
          <div className="w-full md:w-1/2 p-8 flex flex-col justify-center">
            <Card className="shadow-none border-0 bg-transparent">
              <CardHeader className="mb-4 p-0">
                <CardTitle className="text-2xl font-bold mb-2">Sign In as a Provider</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {step === 'phone' ? (
                  <form onSubmit={handleSendOtp} className="space-y-6">
                    {error && (
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                    <div>
                      <Label htmlFor="phone" className="mb-1 block text-base font-medium">Mobile Number</Label>
                      <div className="flex items-center border-b border-border focus-within:border-primary">
                        <span className="text-lg font-semibold text-foreground mr-2 select-none">+91</span>
                        <Input
                          id="phone"
                          type="tel"
                          value={phone}
                          onChange={e => {
                            const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                            setPhone(val);
                          }}
                          placeholder="Enter your Mobile"
                          required
                          maxLength={10}
                          pattern="[6-9]{1}[0-9]{9}"
                          className="border-0 focus:ring-0 focus:outline-none shadow-none px-0 bg-transparent"
                          style={{ boxShadow: 'none', border: 'none', outline: 'none' }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="agree"
                        checked={agreed}
                        onChange={e => setAgreed(e.target.checked)}
                        className="mr-2 accent-primary"
                        required
                      />
                      <label htmlFor="agree" className="text-sm text-muted-foreground">
                        I agree to the{' '}
                        <a href="/terms" target="_blank" className="text-primary underline">Terms and Conditions</a> &amp;{' '}
                        <a href="/privacy" target="_blank" className="text-primary underline">Privacy Policy</a>
                      </label>
                    </div>
                    <Button type="submit" className="w-full" disabled={loading || !agreed || phone.length !== 10}>
                      {loading ? 'Sending OTP...' : 'Continue'}
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="space-y-6">
                    {error && (
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                    <div>
                      <Label htmlFor="otp" className="mb-1 block text-base font-medium">OTP</Label>
                      <InputOTP id="otp" maxLength={6} value={otp} onChange={setOtp} autoFocus required>
                        <InputOTPGroup>
                          {[...Array(6)].map((_, idx) => (
                            <InputOTPSlot key={idx} index={idx} />
                          ))}
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                    <Button type="submit" className="w-full" disabled={loading || otp.length !== 6}>
                      {loading ? 'Verifying...' : 'Verify OTP'}
                    </Button>
                  </form>
                )}
                <Button
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2 mt-4"
                  onClick={handleGoogleSignIn}
                >
                  <img src="/assets/google-icon.svg" alt="Google" className="w-5 h-5" />
                  Continue with Google
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 