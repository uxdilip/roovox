"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Mail, Phone, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { detectUserRoles, getRedirectPath, getCrossRoleMessage } from '@/lib/role-detection';
import { account } from '@/lib/appwrite';

export default function CustomerLoginPage() {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState<'input' | 'otp' | 'password'>('input');
  const [userId, setUserId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isEmail, setIsEmail] = useState(false);

  const { loginWithPhoneOtp, canRequestOtp } = useAuth();
  const router = useRouter();

  // Detect if input is email or phone
  const detectInputType = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  };

  const handleInputChange = (value: string) => {
    setEmailOrPhone(value);
    setError('');
    setIsEmail(detectInputType(value));
  };

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!emailOrPhone.trim()) {
      setError('Please enter your email or phone number');
      return;
    }

    if (isEmail) {
      // Email flow - go to password step
      setStep('password');
    } else {
      // Phone flow - validate and send OTP
      const phonePattern = /^[6-9]\d{9}$/;
      if (!phonePattern.test(emailOrPhone)) {
        setError('Please enter a valid 10-digit Indian phone number');
        return;
      }

      if (!canRequestOtp(emailOrPhone)) {
        setError('Too many OTP requests. Please try again in an hour.');
        return;
      }

      setLoading(true);
      try {
        const result = await loginWithPhoneOtp('+91' + emailOrPhone);
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
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await loginWithPhoneOtp('+91' + emailOrPhone, otp, userId);
      
      // Enhanced role detection
      const session = await account.get();
      if (!session) {
        router.push('/');
        return;
      }

      const roleResult = await detectUserRoles(session.$id, false); // false = not provider login
      const crossRoleMessage = getCrossRoleMessage(roleResult);
      if (crossRoleMessage) {
        alert(crossRoleMessage);
      }
      
      const redirectPath = getRedirectPath(roleResult);
      router.push(redirectPath);
      
    } catch (err: any) {
      setError(err.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      // For now, redirect to customer onboarding for email users
      // You can implement email/password authentication later
      router.push('/customer/onboarding');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    if (typeof window !== 'undefined') {
      const successUrl = window.location.origin + '/';
      const failureUrl = window.location.origin + '/login?error=oauth';
      account.createOAuth2Session('google' as any, successUrl, failureUrl);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Promotional */}
      <div className="hidden lg:flex lg:w-2/3 bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        
        {/* Logo Overlay */}
        <div className="absolute top-8 left-8 z-20">
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
            <span className="text-sm font-bold text-blue-600">S</span>
          </div>
        </div>
        
        <div className="relative z-10 flex flex-col justify-center px-12 py-16 text-white">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-6 leading-tight">
              Join <span className="text-blue-300">Thousands</span> of customers who trust Sniket
            </h1>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
                <span className="text-base">Professional device repair services at your doorstep</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
                <span className="text-base">Same-day service with doorstep pickup</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
                <span className="text-base">Genuine parts with warranty</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/3 flex items-center justify-center p-8">
        <Card className="w-full max-w-md shadow-2xl border-0">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-sm font-bold text-blue-600">S</span>
              </div>
              <p className="text-sm text-gray-500 mb-2">Welcome to Sniket</p>
              <h2 className="text-lg font-bold text-gray-900 mb-4">Get started with your email or phone number</h2>
            </div>

            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {step === 'input' && (
              <form onSubmit={handleContinue} className="space-y-6">
                <div>
                  <div className="relative">
                    {isEmail ? (
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    ) : (
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    )}
                                         <Input
                       type={isEmail ? 'email' : 'tel'}
                       value={emailOrPhone}
                       onChange={(e) => handleInputChange(e.target.value)}
                       placeholder="Enter your email or phone number"
                       className="pl-10 h-10 text-sm"
                       autoFocus
                     />
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    {isEmail ? 'We\'ll send you a magic link' : 'We\'ll send you an OTP'}
                  </p>
                </div>

                                 <Button 
                   type="submit" 
                   className="w-full h-10 text-sm" 
                   disabled={loading || !emailOrPhone.trim()}
                 >
                   {loading ? 'Sending...' : 'Continue'}
                   <ArrowRight className="ml-2 h-4 w-4" />
                 </Button>
              </form>
            )}

            {step === 'otp' && (
              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enter OTP sent to +91 {emailOrPhone}
                  </label>
                                     <Input
                     type="text"
                     value={otp}
                     onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                     placeholder="Enter 6-digit OTP"
                     className="h-10 text-sm text-center tracking-widest"
                     maxLength={6}
                     autoFocus
                   />
                </div>

                                 <Button 
                   type="submit" 
                   className="w-full h-10 text-sm" 
                   disabled={loading || otp.length !== 6}
                 >
                   {loading ? 'Verifying...' : 'Verify OTP'}
                 </Button>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setStep('input')}
                  className="w-full"
                  disabled={loading}
                >
                  Back to Phone Number
                </Button>
              </form>
            )}

            {step === 'password' && (
              <form onSubmit={handleEmailLogin} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enter password for {emailOrPhone}
                  </label>
                                     <Input
                     type="password"
                     value={password}
                     onChange={(e) => setPassword(e.target.value)}
                     placeholder="Enter your password"
                     className="h-10 text-sm"
                     autoFocus
                   />
                </div>

                                 <Button 
                   type="submit" 
                   className="w-full h-10 text-sm" 
                   disabled={loading || !password.trim()}
                 >
                   {loading ? 'Signing in...' : 'Sign In'}
                 </Button>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setStep('input')}
                  className="w-full"
                  disabled={loading}
                >
                  Back to Email
                </Button>
              </form>
            )}

            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">or</span>
                </div>
              </div>

                             <Button
                 variant="outline"
                 className="w-full h-10 mt-4 flex items-center justify-center gap-3 text-sm"
                 onClick={handleGoogleSignIn}
               >
                 <img src="/assets/google-icon.svg" alt="Google" className="w-4 h-4" />
                 Continue with Google
               </Button>
            </div>

            <div className="mt-8 text-center">
              <p className="text-xs text-gray-500">
                By continuing you agree to our{' '}
                <a href="/privacy" className="text-blue-600 hover:underline">privacy policy</a>
                {' '}and{' '}
                <a href="/terms" className="text-blue-600 hover:underline">terms of use</a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}