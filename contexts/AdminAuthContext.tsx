"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { databases, DATABASE_ID } from '@/lib/appwrite';
import { Query } from 'appwrite';

interface AdminUser {
  id: string;
  phone: string;
  name: string;
  status: 'active' | 'inactive';
  createdAt: string;
  lastLogin?: string;
}

interface AdminAuthContextType {
  adminUser: AdminUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  loginWithPhone: (phone: string, otp: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  checkAdminStatus: (phone: string) => Promise<{ isAdmin: boolean; adminUser?: AdminUser }>;
  setAdminUserAfterLogin: (adminUser: AdminUser) => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if admin is already logged in on app start
  useEffect(() => {
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    try {
      const adminSession = localStorage.getItem('admin_session');
      if (adminSession) {
        const sessionData = JSON.parse(adminSession);
        
        // Check if session is still valid (24 hours)
        const sessionAge = Date.now() - new Date(sessionData.loginTime).getTime();
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        
        if (sessionAge < maxAge) {
          // Session is still valid, fetch admin user
          const admin = await getAdminByPhone(sessionData.phone);
          if (admin && admin.status === 'active') {
            setAdminUser(admin);
          } else {
            // Admin no longer exists or inactive
            localStorage.removeItem('admin_session');
          }
        } else {
          // Session expired
          localStorage.removeItem('admin_session');
        }
      }
    } catch (error) {
      console.error('Error checking admin session:', error);
      localStorage.removeItem('admin_session');
    } finally {
      setIsLoading(false);
    }
  };

  // Format phone number to match database format
  const formatPhoneNumber = (phone: string): string => {
    // Remove all non-digit characters
    const cleanPhone = phone.replace(/\D/g, '');
    
    // If it already starts with country code, return as is
    if (cleanPhone.startsWith('91') && cleanPhone.length === 12) {
      return `+${cleanPhone}`;
    }
    
    // If it's a 10-digit Indian number, add +91
    if (cleanPhone.length === 10) {
      return `+91${cleanPhone}`;
    }
    
    // Otherwise return with + prefix if not already there
    if (!phone.startsWith('+')) {
      return `+${cleanPhone}`;
    }
    
    return phone;
  };

  const getAdminByPhone = async (phone: string): Promise<AdminUser | null> => {
    try {
      const formattedPhone = formatPhoneNumber(phone);
      
      const result = await databases.listDocuments(
        DATABASE_ID,
        'admin_users',
        [
          Query.equal('phone', formattedPhone),
          Query.equal('status', 'active'),
          Query.limit(1)
        ]
      );

      if (result.documents.length > 0) {
        const doc = result.documents[0];
        return {
          id: doc.$id,
          phone: doc.phone,
          name: doc.name,
          status: doc.status,
          createdAt: doc.created_at,
          lastLogin: doc.last_login
        };
      }

      return null;
    } catch (error) {
      console.error('Error fetching admin by phone:', error);
      return null;
    }
  };

  const checkAdminStatus = async (phone: string): Promise<{ isAdmin: boolean; adminUser?: AdminUser }> => {
    try {
      const formattedPhone = formatPhoneNumber(phone);
      const admin = await getAdminByPhone(formattedPhone);
      return {
        isAdmin: !!admin,
        adminUser: admin || undefined
      };
    } catch (error) {
      console.error('Error checking admin status:', error);
      return { isAdmin: false };
    }
  };

  const loginWithPhone = async (phone: string, otp: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const formattedPhone = formatPhoneNumber(phone);
      
      // First check if this phone belongs to an admin
      const adminCheck = await checkAdminStatus(formattedPhone);
      if (!adminCheck.isAdmin) {
        return { success: false, error: 'Phone number not authorized for admin access' };
      }

      const admin = adminCheck.adminUser!;

      // Update last login time
      try {
        await databases.updateDocument(
          DATABASE_ID,
          'admin_users',
          admin.id,
          {
            last_login: new Date().toISOString()
          }
        );
      } catch (updateError) {
        console.warn('Could not update last login time:', updateError);
      }

      // Create admin session
      const sessionData = {
        phone: admin.phone,
        adminId: admin.id,
        loginTime: new Date().toISOString()
      };

      localStorage.setItem('admin_session', JSON.stringify(sessionData));
      setAdminUser({ ...admin, lastLogin: new Date().toISOString() });

      return { success: true };

    } catch (error) {
      console.error('Error during admin login:', error);
      return { success: false, error: 'Login failed. Please try again.' };
    }
  };

  const logout = () => {
    localStorage.removeItem('admin_session');
    setAdminUser(null);
  };

  const setAdminUserAfterLogin = (adminUser: AdminUser) => {
    // Create admin session in localStorage
    const sessionData = {
      phone: adminUser.phone,
      adminId: adminUser.id,
      loginTime: new Date().toISOString()
    };
    localStorage.setItem('admin_session', JSON.stringify(sessionData));
    
    // Update state
    setAdminUser(adminUser);
  };

  const value: AdminAuthContextType = {
    adminUser,
    isLoading,
    isAuthenticated: !!adminUser,
    loginWithPhone,
    logout,
    checkAdminStatus,
    setAdminUserAfterLogin
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}
