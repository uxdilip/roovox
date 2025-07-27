"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { account, databases, DATABASE_ID, COLLECTIONS } from '@/lib/appwrite';
import { ID } from 'appwrite';
import { User } from '@/types';
import { createUserDocument, getUserByUserId, updateUserActiveRole, addProviderRoleToUser } from '@/lib/appwrite-services';
import { useRouter } from 'next/navigation';
import { useLocation } from './LocationContext';
import { Query } from 'appwrite';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  loginWithPhoneOtp: (phone: string, otp?: string, userId?: string) => Promise<{ userId?: string } | void>;
  logout: () => Promise<void>;
  setUser?: React.Dispatch<React.SetStateAction<User | null>>;
  roles: string[];
  activeRole: 'customer' | 'provider';
  setActiveRole: (role: 'customer' | 'provider') => Promise<void>;
  refreshSession: () => Promise<void>;
  showLocationPrompt: boolean;
  setShowLocationPrompt: React.Dispatch<React.SetStateAction<boolean>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [roles, setRoles] = useState<string[]>([]);
  const [activeRole, setActiveRoleState] = useState<'customer' | 'provider'>('customer');
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const router = useRouter();
  const { setLocation, ...locationContext } = useLocation();

  useEffect(() => {
    checkAuth();
  }, []);

  // Debug: log user and isLoading on every render
  useEffect(() => {
    console.log('AuthContext: user', user, 'isLoading', isLoading);
  }, [user, isLoading]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('activeRole', activeRole);
    }
  }, [activeRole]);

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
    try {
      const session = await account.get();
      console.log('[DEBUG] Appwrite session in checkAuth:', session);
      if (session) {
        try {
          // Always merge roles from existing user document and context
          let mergedRoles: string[] = [];
          try {
            const existingUserDoc = await getUserByUserId(session.$id);
            console.log('[DEBUG] User doc in checkAuth:', existingUserDoc);
            if (existingUserDoc && Array.isArray(existingUserDoc.roles)) {
              mergedRoles = [...existingUserDoc.roles];
            }
          } catch (e) {
            console.log('[DEBUG] Error fetching user doc in checkAuth:', e);
          }
          if (!mergedRoles.includes('customer')) mergedRoles.push('customer');
          if (typeof window !== 'undefined' && localStorage.getItem('loginAsProvider') === '1' && !mergedRoles.includes('provider')) {
            mergedRoles.push('provider');
          }
          const activeRole = mergedRoles.includes('provider') ? 'provider' : 'customer';
          const location = (locationContext.location || {}) as any;
          console.log('[DEBUG] LocationContext.location:', location);
          const userData = {
            userId: session.$id,
            name: session.name,
            email: session.email,
            phone: session.phone || '',
            roles: mergedRoles,
            activeRole: activeRole as 'customer' | 'provider',
            isVerified: false,
            isActive: true,
            addressCity: location.city || '',
            addressState: location.state || '',
            addressZip: location.zip || '',
            addressLat: location.coordinates?.[0] || 0,
            addressLng: location.coordinates?.[1] || 0,
          };
          console.log('[DEBUG] userData to be stored:', userData);
          try {
            const created = await createUserDocument(userData);
            console.log('[DEBUG] createUserDocument result:', created);
          } catch (e: any) {
            if (e.code === 409) {
              const res = await databases.listDocuments(
                DATABASE_ID,
                'User',
                [Query.equal('user_id', session.$id), Query.limit(1)]
              );
              if (res.documents.length > 0) {
                const updated = await databases.updateDocument(
                  DATABASE_ID,
                  'User',
                  res.documents[0].$id,
                  userData
                );
                console.log('[DEBUG] updateDocument result:', updated);
              }
            } else {
              throw e;
            }
          }
          if (typeof window !== 'undefined') localStorage.removeItem('loginAsProvider');
        } catch (e) {
          // Ignore if already exists or error
          console.log('[DEBUG] Error in user doc creation/update in checkAuth:', e);
        }
        try {
          const userDoc = await getUserByUserId(session.$id);
          console.log('[DEBUG] Final userDoc in checkAuth:', userDoc);
          if (userDoc) {
            setRoles(userDoc.roles);
            const savedActiveRole = localStorage.getItem('activeRole') as 'customer' | 'provider';
            const userActiveRole = userDoc.activeRole || 'customer';
            if (userDoc.roles.includes('customer') && userDoc.roles.includes('provider')) {
              setActiveRoleState(savedActiveRole || userActiveRole);
            } else if (userDoc.roles.includes('provider')) {
              setActiveRoleState('provider');
            } else {
              setActiveRoleState('customer');
            }
            setUser({
              id: userDoc.id,
              name: userDoc.name,
              email: userDoc.email,
              phone: userDoc.phone,
              role: userDoc.roles.includes('provider') ? 'provider' : 'customer',
              address: {
                street: '',
                city: userDoc.address.city,
                state: userDoc.address.state,
                zip: userDoc.address.zip,
                coordinates: [userDoc.address.lat, userDoc.address.lng]
              },
              created_at: userDoc.createdAt
            });
            if (userDoc.address && userDoc.address.city) {
              setLocation({
                address: `${userDoc.address.city}, ${userDoc.address.state}`,
                city: userDoc.address.city,
                state: userDoc.address.state,
                zip: userDoc.address.zip,
                coordinates: [userDoc.address.lat, userDoc.address.lng]
              });
            }
            if (!userDoc.address.city) {
              setShowLocationPrompt(true);
            } else {
              setShowLocationPrompt(false);
            }
            console.log('✅ User session validated successfully:', userDoc.id);
          } else {
            setRoles(['customer']);
            setActiveRoleState('customer');
            setUser({
              id: session.$id,
              name: session.name || 'User',
              email: session.email || `user_${session.$id}@noemail.local`,
              phone: session.phone || '',
              role: 'customer',
              address: {
                street: '',
                city: '',
                state: '',
                zip: '',
                coordinates: [0, 0]
              },
              created_at: session.$createdAt
            });
            setShowLocationPrompt(true);
            console.log('⚠️ User document not found, using session data');
          }
        } catch (error) {
          console.error('❌ Error loading user document:', error);
          setRoles(['customer']);
          setActiveRoleState('customer');
          setUser({
            id: session.$id,
            name: session.name || 'User',
            email: session.email || `user_${session.$id}@noemail.local`,
            phone: session.phone || '',
            role: 'customer',
            address: {
              street: '',
              city: '',
              state: '',
              zip: '',
              coordinates: [0, 0]
            },
            created_at: session.$createdAt
          });
          setShowLocationPrompt(true);
        }
      }
    } catch (error) {
      console.error('[DEBUG] No Appwrite session in checkAuth:', error);
      setUser(null);
      setRoles([]);
      setActiveRoleState('customer');
      setShowLocationPrompt(false);
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithPhoneOtp = async (phone: string, otp?: string, userId?: string) => {
    if (!otp) {
      try { await account.deleteSession('current'); } catch (e) {}
      const token = await account.createPhoneToken(ID.unique(), phone);
      return { userId: token.userId };
    } else {
      try { await account.deleteSession('current'); } catch (e) {}
      await account.createSession(userId!, otp);
      // Always fetch the current session after login
      const accountDetails = await account.get();
      try {
        await createUserDocument({
          userId: accountDetails.$id, // <-- always use this!
          name: 'Phone User',
          email: `phone_${accountDetails.$id}@noemail.local`,
          phone: phone,
          roles: ['customer']
        });
      } catch (error) {
        console.log('User document may already exist or error creating:', error);
      }
      const userDoc = await getUserByUserId(accountDetails.$id);
      setUser({
        id: accountDetails.$id,
        name: accountDetails.name,
        email: accountDetails.email,
        phone: phone,
        role: 'customer',
        address: {
          street: '',
          city: userDoc?.address?.city || '',
          state: userDoc?.address?.state || '',
          zip: userDoc?.address?.zip || '',
          coordinates: [userDoc?.address?.lat || 0, userDoc?.address?.lng || 0]
        },
        created_at: accountDetails.$createdAt
      });
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
      setUser({
        id: accountDetails.$id,
        name: accountDetails.name,
        email: accountDetails.email,
        phone: '',
        role: 'customer',
        address: {
          street: '',
          city: userDoc?.address?.city || '',
          state: userDoc?.address?.state || '',
          zip: userDoc?.address?.zip || '',
          coordinates: [userDoc?.address?.lat || 0, userDoc?.address?.lng || 0]
        },
        created_at: accountDetails.$createdAt
      });
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
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await account.deleteSession('current');
      setUser(null);
    } catch (error) {
      throw error;
    }
  };

  const refreshSession = async () => {
    try {
      const session = await account.get();
      console.log('[DEBUG] Appwrite session in refreshSession:', session);
      if (session) {
        const userDoc = await getUserByUserId(session.$id);
        console.log('[DEBUG] User doc in refreshSession:', userDoc);
        if (userDoc) {
          setUser({
            id: userDoc.id,
            name: userDoc.name,
            email: userDoc.email,
            phone: userDoc.phone,
            role: userDoc.roles.includes('provider') ? 'provider' : 'customer',
            address: {
              street: '',
              city: userDoc.address.city,
              state: userDoc.address.state,
              zip: userDoc.address.zip,
              coordinates: [userDoc.address.lat, userDoc.address.lng]
            },
            created_at: userDoc.createdAt
          });
          if (userDoc.address && userDoc.address.city) {
            setLocation({
              address: `${userDoc.address.city}, ${userDoc.address.state}`,
              city: userDoc.address.city,
              state: userDoc.address.state,
              zip: userDoc.address.zip,
              coordinates: [userDoc.address.lat, userDoc.address.lng]
            });
          }
          if (!userDoc.address.city) {
            setShowLocationPrompt(true);
          } else {
            setShowLocationPrompt(false);
          }
        }
      }
    } catch (error) {
      console.error('[DEBUG] Error refreshing session in refreshSession:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, loginWithPhoneOtp, logout, setUser, roles, activeRole, setActiveRole, refreshSession, showLocationPrompt, setShowLocationPrompt }}>
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