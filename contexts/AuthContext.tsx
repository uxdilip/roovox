"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { account, databases, DATABASE_ID, COLLECTIONS } from '@/lib/appwrite';
import { ID } from 'appwrite';
import { User } from '@/types';
import { createUserDocument, getUserByUserId, updateUserActiveRole, addProviderRoleToUser } from '@/lib/appwrite-services';
import { detectUserRoles, getRedirectPath, getCrossRoleMessage } from '@/lib/role-detection';
import { useRouter } from 'next/navigation';
import { useLocation } from './LocationContext';
import { Query } from 'appwrite';

// Rate limiting and security constants
const RATE_LIMIT = {
  OTP_REQUESTS: 10, // per phone per hour
  OTP_ATTEMPTS: 10,  // per OTP
  OTP_EXPIRY: 300  // 5 minutes in seconds
};

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthComplete: boolean;
  loginWithPhoneOtp: (phone: string, otp?: string, userId?: string) => Promise<{ userId?: string } | void>;
  logout: () => Promise<void>;
  setUser?: React.Dispatch<React.SetStateAction<User | null>>;
  roles: string[];
  activeRole: 'customer' | 'provider';
  setActiveRole: (role: 'customer' | 'provider') => Promise<void>;
  refreshSession: () => Promise<void>;
  refreshUserData: () => Promise<void>;
  showLocationPrompt: boolean;
  setShowLocationPrompt: React.Dispatch<React.SetStateAction<boolean>>;
  // New rate limiting methods
  canRequestOtp: (phone: string) => boolean;
  getOtpAttempts: (userId: string) => number;
  clearOtpAttempts: (userId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthComplete, setIsAuthComplete] = useState(false);
  const [roles, setRoles] = useState<string[]>([]);
  const [activeRole, setActiveRoleState] = useState<'customer' | 'provider'>('customer');
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const router = useRouter();
  const { setLocation, ...locationContext } = useLocation();

  // Rate limiting storage
  const [otpRequests, setOtpRequests] = useState<Record<string, { count: number; lastRequest: number }>>({});
  const [otpAttempts, setOtpAttempts] = useState<Record<string, number>>({});

  useEffect(() => {
    console.log('🔍 AuthContext useEffect triggered - calling checkAuth');
    checkAuth();
  }, []);

  // Removed debug logging for production

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('activeRole', activeRole);
    }
  }, [activeRole]);

  // Rate limiting methods
  const canRequestOtp = (phone: string): boolean => {
    const now = Date.now();
    const requestData = otpRequests[phone];
    
    if (!requestData) return true;
    
    const timeSinceLastRequest = now - requestData.lastRequest;
    const hourInMs = 60 * 60 * 1000;
    
    // Reset count if more than an hour has passed
    if (timeSinceLastRequest > hourInMs) {
      setOtpRequests(prev => ({ ...prev, [phone]: { count: 0, lastRequest: now } }));
      return true;
    }
    
    return requestData.count < RATE_LIMIT.OTP_REQUESTS;
  };

  const getOtpAttempts = (userId: string): number => {
    return otpAttempts[userId] || 0;
  };

  const clearOtpAttempts = (userId: string): void => {
    setOtpAttempts(prev => ({ ...prev, [userId]: 0 }));
  };

  const recordOtpRequest = (phone: string): void => {
    const now = Date.now();
    setOtpRequests(prev => ({
      ...prev,
      [phone]: {
        count: (prev[phone]?.count || 0) + 1,
        lastRequest: now
      }
    }));
  };

  const recordOtpAttempt = (userId: string): void => {
    setOtpAttempts(prev => ({
      ...prev,
      [userId]: (prev[userId] || 0) + 1
    }));
  };

  const setActiveRole = async (role: 'customer' | 'provider') => {
    if (!user) return;
    try {
      await updateUserActiveRole(user.id, role);
      if (role === 'provider') {
        await addProviderRoleToUser(user.id);
      }
      setActiveRoleState(role);
      if (typeof window !== 'undefined') {
        localStorage.setItem('activeRole', role);
      }
    } catch (error) {
      console.error('Error updating active role:', error);
    }
  };

  const checkAuth = async () => {
    console.log('🔍 checkAuth called');
    setIsLoading(true);
    setIsAuthComplete(false);
    
    try {
      const session = await account.get();
      // Session found
      if (session) {
        try {
          // Always merge roles from existing user document and context
          let mergedRoles: string[] = [];
          try {
            const existingUserDoc = await getUserByUserId(session.$id);
            // User document found
            if (existingUserDoc && Array.isArray(existingUserDoc.roles)) {
              mergedRoles = [...existingUserDoc.roles];
            }
          } catch (e) {
            // Error fetching user document
          }
          if (!mergedRoles.includes('customer')) mergedRoles.push('customer');
          if (typeof window !== 'undefined' && localStorage.getItem('loginAsProvider') === '1' && !mergedRoles.includes('provider')) {
            mergedRoles.push('provider');
          }
          const activeRole = mergedRoles.includes('provider') ? 'provider' : 'customer';
          const location = (locationContext.location || {}) as any;
          
          // Check if user needs phone onboarding (Google OAuth users)
          const userPhone = session.phone || '';
          const isProviderLogin = typeof window !== 'undefined' && localStorage.getItem('loginAsProvider') === '1';
          
          // Use role detection to determine if user needs onboarding
          const roleResult = await detectUserRoles(session.$id, isProviderLogin, userPhone);
          const needsPhoneOnboarding = roleResult.needsPhoneOnboarding;
          const needsProviderOnboarding = roleResult.needsProviderOnboarding;
          
          // Location context loaded
          const userData: User = {
            id: session.$id,
            name: session.name || 'User',
            email: session.email || `user_${session.$id}@noemail.local`,
            phone: userPhone,
            role: activeRole as 'customer' | 'provider',
            address: {
              street: '',
              city: location?.city || '',
              state: location?.state || '',
              zip: location?.zip || '',
              coordinates: location?.coordinates || [0, 0]
            },
            created_at: session.$createdAt
          };
          setUser(userData);
          setRoles(mergedRoles);
          setActiveRoleState(activeRole as 'customer' | 'provider');
          
          // Check if user needs to be redirected to onboarding
          if (needsPhoneOnboarding && !isProviderLogin && typeof window !== 'undefined') {
            const currentPath = window.location.pathname;
            if (currentPath !== '/customer/onboarding') {
              console.log('🔄 Google OAuth user needs phone onboarding, redirecting...');
              router.push('/customer/onboarding');
            }
          }
          
          // Check if provider needs to be redirected to onboarding
          if (needsProviderOnboarding && isProviderLogin && typeof window !== 'undefined') {
            const currentPath = window.location.pathname;
            if (currentPath !== '/provider/onboarding') {
              console.log('🔄 Google OAuth provider needs onboarding, redirecting...');
              router.push('/provider/onboarding');
            }
          }
          
          if (location?.city) {
            setLocation(location);
            setShowLocationPrompt(false);
          } else {
            setShowLocationPrompt(true);
          }
        } catch (error) {
          console.error('Error setting user data:', error);
          setUser(null);
          setRoles([]);
        }
      } else {
        setUser(null);
        setRoles([]);
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      setUser(null);
      setRoles([]);
    } finally {
      console.log('🔍 checkAuth completed, setting isLoading to false');
      setIsLoading(false);
      setIsAuthComplete(true);
    }
  };

  const loginWithPhoneOtp = async (phone: string, otp?: string, userId?: string) => {
    // Rate limiting check
    if (!otp && !canRequestOtp(phone)) {
      throw new Error('Too many OTP requests. Please try again in an hour.');
    }

    // Check OTP attempts
    if (otp && userId && getOtpAttempts(userId) >= RATE_LIMIT.OTP_ATTEMPTS) {
      throw new Error('Too many OTP attempts. Please request a new OTP.');
    }

    if (!otp) {
      try { 
        await account.deleteSession('current'); 
      } catch (e) {
        console.log('No existing session to delete');
      }
      
      recordOtpRequest(phone);
      const token = await account.createPhoneToken(ID.unique(), phone);
      return { userId: token.userId };
    } else {
      try { 
        await account.deleteSession('current'); 
      } catch (e) {
        console.log('No existing session to delete');
      }
      
      recordOtpAttempt(userId!);
      await account.createSession(userId!, otp);
      
      // Clear OTP attempts on successful login
      clearOtpAttempts(userId!);
      
      // Always fetch the current session after login
      const accountDetails = await account.get();
      try {
        await createUserDocument({
          userId: accountDetails.$id,
          name: 'Phone User',
          email: `phone_${accountDetails.$id}@noemail.local`,
          phone: phone,
          roles: ['customer']
        });
      } catch (error) {
        console.log('User document may already exist or error creating:', error);
      }
      
      const userDoc = await getUserByUserId(accountDetails.$id);
      const userData: User = {
        id: accountDetails.$id,
        name: accountDetails.name || 'Phone User',
        email: accountDetails.email || `phone_${accountDetails.$id}@noemail.local`,
        phone: phone,
        role: 'customer' as const,
        address: {
          street: '',
          city: userDoc?.address?.city || '',
          state: userDoc?.address?.state || '',
          zip: userDoc?.address?.zip || '',
          coordinates: [userDoc?.address?.lat || 0, userDoc?.address?.lng || 0]
        },
        created_at: accountDetails.$createdAt
      };
      
      setUser(userData);
      
      // Persist session
      if (typeof window !== 'undefined') {
        localStorage.setItem('user_session', JSON.stringify({
          id: userData.id,
          roles: userData.role,
          lastLogin: Date.now()
        }));
      }
      
      if (userDoc?.address?.city) {
        setLocation({
          address: `${userDoc.address.city}, ${userDoc.address.state}`,
          city: userDoc.address.city,
          state: userDoc.address.state,
          zip: userDoc.address.zip,
          coordinates: [userDoc.address.lat, userDoc.address.lng]
        });
      }
      
      if (!userDoc?.address?.city) {
        setShowLocationPrompt(true);
      } else {
        setShowLocationPrompt(false);
      }
      
      console.log('User set in context:', accountDetails);
      
      // Call checkAuth to ensure all user data is properly set
      await checkAuth();
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      const user = await account.create(ID.unique(), email, password, name);
      console.log('Account created successfully:', user.$id);
      await account.createEmailPasswordSession(email, password);
      console.log('Session created successfully');
      await createUserDocument({
        userId: user.$id,
        name: name,
        email: email,
        phone: '',
        roles: ['customer']
      });
      const accountDetails = await account.get();
      const userDoc = await getUserByUserId(accountDetails.$id);
      const userData: User = {
        id: accountDetails.$id,
        name: accountDetails.name || name,
        email: accountDetails.email || email,
        phone: '',
        role: 'customer' as const,
        address: {
          street: '',
          city: userDoc?.address?.city || '',
          state: userDoc?.address?.state || '',
          zip: userDoc?.address?.zip || '',
          coordinates: [userDoc?.address?.lat || 0, userDoc?.address?.lng || 0]
        },
        created_at: accountDetails.$createdAt
      };
      
      setUser(userData);
      
      // Persist session
      if (typeof window !== 'undefined') {
        localStorage.setItem('user_session', JSON.stringify({
          id: userData.id,
          roles: userData.role,
          lastLogin: Date.now()
        }));
      }
      
      if (userDoc?.address?.city) {
        setLocation({
          address: `${userDoc.address.city}, ${userDoc.address.state}`,
          city: userDoc.address.city,
          state: userDoc.address.state,
          zip: userDoc.address.zip,
          coordinates: [userDoc.address.lat, userDoc.address.lng]
        });
      }
      if (!userDoc?.address?.city) {
        setShowLocationPrompt(true);
      } else {
        setShowLocationPrompt(false);
      }
    } catch (error) {
      console.error('Error in register:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await account.deleteSession('current');
      setUser(null);
      setRoles([]);
      setActiveRoleState('customer');
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user_session');
        localStorage.removeItem('activeRole');
        localStorage.removeItem('loginAsProvider');
      }
      router.push('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const refreshSession = async () => {
    try {
      await account.updateSession('current');
      await checkAuth();
    } catch (error) {
      console.error('Error refreshing session:', error);
      // Don't automatically logout on session update failure
      // Just try to refresh the auth state
      try {
        await checkAuth();
      } catch (checkAuthError) {
        console.error('Error in checkAuth after session update failure:', checkAuthError);
        // Only logout if checkAuth also fails
        if (checkAuthError instanceof Error && checkAuthError.message.includes('session')) {
          await logout();
        }
      }
    }
  };

  const refreshUserData = async () => {
    try {
      await checkAuth();
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      loginWithPhoneOtp,
      logout,
      setUser,
      roles,
      activeRole,
      setActiveRole,
      refreshSession,
      refreshUserData,
      showLocationPrompt,
      setShowLocationPrompt,
      canRequestOtp,
      getOtpAttempts,
      clearOtpAttempts,
      isAuthComplete
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}