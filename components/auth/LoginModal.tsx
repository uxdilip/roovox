"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getProviderByUserId, getCustomerByUserId } from '@/lib/appwrite-services';
import { detectUserRoles, getRedirectPath, getCrossRoleMessage } from '@/lib/role-detection';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Clock, RefreshCw } from 'lucide-react';
import { account, databases, DATABASE_ID, COLLECTIONS } from '@/lib/appwrite';
import { createGoogleOAuthSession, GOOGLE_OAUTH_ENABLED, getOAuthUrls } from '@/lib/appwrite';

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  returnUrl?: string;
}

export default function LoginModal({ open, onOpenChange, returnUrl }: LoginModalProps) {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [userId, setUserId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [canResend, setCanResend] = useState(false);

  const { user, loginWithPhoneOtp, canRequestOtp } = useAuth();
  const router = useRouter();

  // OTP Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  // Format timer display
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get better error messages
  const getErrorMessage = (error: any) => {
    if (typeof error === 'string') {
      if (error.includes('Too many OTP requests')) {
        return 'Too many OTP requests. Please try again in an hour.';
      }
      if (error.includes('Too many OTP attempts')) {
        return 'Too many OTP attempts. Please request a new OTP.';
      }
      if (error.includes('phone_invalid')) {
        return 'Please enter a valid 10-digit Indian phone number.';
      }
      if (error.includes('otp_expired')) {
        return 'OTP has expired. Please request a new one.';
      }
      if (error.includes('otp_invalid')) {
        return 'Invalid OTP. Please try again.';
      }
      return error;
    }
    return 'Something went wrong. Please try again.';
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const phonePattern = /^[6-9]\d{9}$/;
    if (!phonePattern.test(phone)) {
      setError('Please enter a valid 10-digit Indian phone number');
      return;
    }

    // Check rate limiting
    if (!canRequestOtp(phone)) {
      setError('Too many OTP requests. Please try again in an hour.');
      return;
    }

    setLoading(true);
    try {
      const result = await loginWithPhoneOtp('+91' + phone);
      if (result && result.userId) {
        setUserId(result.userId);
        setStep('otp');
        setOtpTimer(300); // 5 minutes
        setCanResend(false);
      } else {
        setError('Failed to send OTP');
      }
    } catch (err: any) {
      setError(getErrorMessage(err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;
    
    setLoading(true);
    setError('');
    try {
      const result = await loginWithPhoneOtp('+91' + phone);
      if (result && result.userId) {
        setOtpTimer(300); // 5 minutes
        setCanResend(false);
        setOtp(''); // Clear previous OTP
      } else {
        setError('Failed to resend OTP');
      }
    } catch (err: any) {
      setError(getErrorMessage(err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      console.log('🔐 Starting OTP verification...');
      await loginWithPhoneOtp('+91' + phone, otp, userId);
      console.log('✅ OTP verification successful');
      
      // Enhanced role detection with cross-role handling
      try {
        console.log('🔄 Checking user type after login...');
        const session = await account.get();
        
        if (!session) {
          console.log('❌ No session found, redirecting to home');
          onOpenChange(false);
          router.push('/');
          return;
        }
        
        console.log('👤 Session found for user:', session.$id);
        
        // Enhanced role detection using utility functions
        const isProviderLogin = window.location.pathname.includes('/provider/login');
        const roleResult = await detectUserRoles(session.$id, isProviderLogin);
        
        console.log('🔍 Role detection results:', roleResult);
        
        // Check for cross-role access and show message if needed
        const crossRoleMessage = getCrossRoleMessage(roleResult);
        if (crossRoleMessage) {
          alert(crossRoleMessage);
        }
        
        // Get redirect path based on role detection
        const redirectPath = getRedirectPath(roleResult);
        console.log('🔄 Redirecting to:', redirectPath);
        
        router.push(redirectPath);
        
        onOpenChange(false);
      } catch (error) {
        console.error('❌ Error checking user type:', error);
        onOpenChange(false);
        router.push('/');
      }
      
    } catch (err: any) {
      console.error('❌ OTP verification failed:', err);
      setError(getErrorMessage(err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (typeof window !== 'undefined') {
      try {
        const { successUrl, failureUrl } = getOAuthUrls('/customer/dashboard');
        await createGoogleOAuthSession(successUrl, failureUrl);
      } catch (error: any) {
        console.error('Google OAuth error:', error);
        setError(error.message || 'Google sign-in is not available at the moment. Please use phone number instead.');
      }
    }
  };

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setPhone('');
      setOtp('');
      setStep('phone');
      setUserId('');
      setError('');
      setLoading(false);
      setAgreed(false);
      setOtpTimer(0);
      setCanResend(false);
    }
  }, [open]);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-2xl shadow-2xl bg-white/80 backdrop-blur-lg">
          <div className="flex flex-col md:flex-row">
            <div className="hidden md:flex flex-col justify-center items-center bg-muted w-1/2 p-8">
              <img src="/assets/undraw_access-account_aydp.svg" alt="Login Illustration" className="w-72 h-72 object-contain" />
            </div>
            <div className="w-full md:w-1/2 p-8 flex flex-col justify-center">
              <Card className="shadow-none border-0 bg-transparent">
                <CardHeader className="mb-4 p-0">
                  <CardTitle className="text-2xl font-bold mb-2">Login/Signup</CardTitle>
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
                        {otpTimer > 0 && (
                          <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>OTP expires in {formatTimer(otpTimer)}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit" className="flex-1" disabled={loading || otp.length !== 6}>
                          {loading ? 'Verifying...' : 'Verify OTP'}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleResendOtp}
                          disabled={!canResend || loading}
                          className="flex items-center gap-2"
                        >
                          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                          Resend
                        </Button>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setStep('phone')}
                        className="w-full"
                        disabled={loading}
                      >
                        Back to Phone Number
                      </Button>
                    </form>
                  )}
                  {GOOGLE_OAUTH_ENABLED && (
                    <Button
                      variant="outline"
                      className="w-full flex items-center justify-center gap-2 mt-4"
                      onClick={handleGoogleSignIn}
                    >
                      <img src="/assets/brand-logos/google.png" alt="Google" className="w-5 h-5" />
                      Continue with Google
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Removed CustomerOnboarding component */}
    </>
  );
} 