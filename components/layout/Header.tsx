"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { updateUserDocument } from '@/lib/appwrite-services';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Smartphone, User, LogOut, Settings, Calendar, MapPin, User as UserIcon, ChevronDown, Users } from 'lucide-react';
import LoginPage from '@/app/login/page';
import { databases, DATABASE_ID, COLLECTIONS } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { useLocation } from '@/contexts/LocationContext';
import { Dialog, DialogTrigger, DialogContent } from '@/components/ui/dialog';
import LocationSelector from '@/components/LocationSelector';

const CITIES = ['Chandigarh', 'Delhi', 'Mumbai', 'Bangalore'];

export function Header() {
  const { user, logout, setUser, isLoading, roles, activeRole, setActiveRole } = useAuth();
  const router = useRouter();
  const [loginOpen, setLoginOpen] = useState(false);
  const [cityMenuOpen, setCityMenuOpen] = useState(false);
  const [pincode, setPincode] = useState('');
  const [pinLoading, setPinLoading] = useState(false);
  const [pinError, setPinError] = useState('');
  const { location } = useLocation();
  const [locationModalOpen, setLocationModalOpen] = useState(false);

  const handleCityChange = async (city: string, state?: string) => {
    if (user && setUser) {
      setUser({ ...user, address: { ...user.address, city, state: state || user.address.state } });
      
      // Update in user collection
      try {
        await updateUserDocument(user.id, {
          address_city: city,
          address_state: state || user.address.state
        });
        console.log('✅ Location updated in user collection');
      } catch (error) {
        console.error('❌ Error updating location in user collection:', error);
      }
    }
    setCityMenuOpen(false);
  };

  const handlePincodeSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError('');
    setPinLoading(true);
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
      const data = await res.json();
      if (data[0].Status === 'Success' && data[0].PostOffice && data[0].PostOffice.length > 0) {
        const city = data[0].PostOffice[0].District;
        const state = data[0].PostOffice[0].State;
        const zip = pincode;
        
        // Update user state
        if (user && setUser) {
          setUser({ 
            ...user, 
            address: { 
              ...user.address, 
              city, 
              state, 
              zip 
            } 
          });
        }
        
        // Update in user collection
        try {
          await updateUserDocument(user!.id, {
            address_city: city,
            address_state: state,
            address_zip: zip
          });
          console.log('✅ Pincode location updated in user collection');
        } catch (error) {
          console.error('❌ Error updating pincode location in user collection:', error);
        }
        
        setPincode('');
      } else {
        setPinError('Invalid pincode');
      }
    } catch (err) {
      setPinError('Failed to fetch location');
    } finally {
      setPinLoading(false);
    }
  };

  // Handle location updates from LocationSelector
  const handleLocationUpdate = async (locationData: any) => {
    if (user) {
      try {
        await updateUserDocument(user.id, {
          address_city: locationData.city,
          address_state: locationData.state,
          address_zip: locationData.zip,
          address_lat: locationData.coordinates[0],
          address_lng: locationData.coordinates[1]
        });
        console.log('✅ Location updated in user collection from Header');
      } catch (error) {
        console.error('❌ Error updating location in user collection:', error);
      }
    }
  };

  const handleLogout = () => {
    logout();
  };

  const handleRoleSwitch = async (newRole: 'customer' | 'provider') => {
    try {
      await setActiveRole(newRole);
      if (newRole === 'provider') {
        if (!user) return;
        // Check onboarding status before redirecting
        let isOnboardingCompleted = false;
        try {
          const businessSetupRes = await databases.listDocuments(
            DATABASE_ID,
            'business_setup',
            [
              Query.equal('user_id', user.id),
              Query.limit(1)
            ]
          );
          if (businessSetupRes.documents.length > 0) {
            const onboardingData = JSON.parse(businessSetupRes.documents[0].onboarding_data || '{}');
            const hasPersonalDetails = !!onboardingData.personalDetails?.fullName;
            const hasBusinessInfo = !!onboardingData.businessInfo?.businessName;
            const hasServiceSetup = !!onboardingData.serviceSetup?.location;
            const hasServiceSelection = !!(
              (onboardingData.serviceSelection?.mobile?.brands?.length > 0) ||
              (onboardingData.serviceSelection?.laptop?.brands?.length > 0)
            );
            const hasPayment = !!onboardingData.payment?.upi;
            isOnboardingCompleted = Boolean(hasPersonalDetails && hasBusinessInfo && hasServiceSetup && hasServiceSelection && hasPayment);
          }
        } catch (e) {
          // If error, treat as not completed
          isOnboardingCompleted = false;
        }
        if (isOnboardingCompleted) {
          router.push('/provider/dashboard');
        } else {
          router.push('/provider/onboarding');
        }
      } else {
        router.push('/');
      }
    } catch (error) {
      console.error('Error switching role:', error);
    }
  };

  // Determine logo link based on activeRole
  let logoHref = '/';
  if (activeRole === 'provider') {
    logoHref = '/provider/dashboard';
  }
  
  // Debug logging

  // Check if user has both roles
  const hasBothRoles = roles.includes('customer') && roles.includes('provider');

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between gap-4">
        {/* Logo */}
        <Link 
          href={logoHref} 
          className="flex items-center space-x-2"
          onClick={() => {
            console.log('🔍 Logo clicked:', { activeRole, logoHref, currentPath: typeof window !== 'undefined' ? window.location.pathname : 'server' });
          }}
        >
          <Smartphone className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Roovox
          </span>
        </Link>

        {/* Center search bar (only after login) */}
        {user ? (
          <div className="flex-1 flex justify-center px-8">
            <div className="w-full max-w-xl flex items-center bg-gray-100 rounded-lg px-4 py-2">
              <svg className="h-5 w-5 text-gray-400 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
              <input
                type="text"
                placeholder="Search for mobiles, accessories & More"
                className="w-full bg-transparent outline-none border-none text-base placeholder-gray-400"
              />
            </div>
          </div>
        ) : !isLoading ? (
        <nav className="hidden md:flex items-center space-x-6">
          <Link href="/services" className="text-sm font-medium hover:text-primary transition-colors">
            Services
          </Link>
          <Link href="/providers" className="text-sm font-medium hover:text-primary transition-colors">
            Providers
          </Link>
          <Link href="/how-it-works" className="text-sm font-medium hover:text-primary transition-colors">
            How It Works
          </Link>
        </nav>
        ) : (
          <div className="flex-1" />
        )}

        {/* Right side: location and user dropdown after login, else sign in */}
        <div className="flex items-center space-x-4">
          <button
            className="flex items-center space-x-1 text-base font-medium text-gray-700 cursor-pointer bg-transparent border-none outline-none"
            onClick={() => setLocationModalOpen(true)}
          >
            <MapPin className="h-5 w-5 text-primary" />
            <span>{location?.city || 'Select Location'}</span>
            <ChevronDown className="h-4 w-4 ml-1 text-gray-400" />
          </button>
          <Dialog open={locationModalOpen} onOpenChange={setLocationModalOpen}>
            <DialogContent className="max-w-md w-full p-0 rounded-lg overflow-hidden">
              <LocationSelector onClose={() => setLocationModalOpen(false)} onLocationUpdate={handleLocationUpdate} />
            </DialogContent>
          </Dialog>
          {isLoading ? (
            <div className="w-32 h-8 bg-gray-100 rounded animate-pulse" />
          ) : user ? (
            <>
              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span>{user.name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {/* Switch to Seller option - only show if user has both roles and is currently customer */}
                  {hasBothRoles && activeRole === 'customer' && (
                    <DropdownMenuItem onClick={() => handleRoleSwitch('provider')}>
                      <Settings className="h-4 w-4 mr-2" />
                      Switch to Seller
                    </DropdownMenuItem>
                  )}
                  
                  {/* Switch to Customer option - only show if user has both roles and is currently provider */}
                  {hasBothRoles && activeRole === 'provider' && (
                    <DropdownMenuItem onClick={() => handleRoleSwitch('customer')}>
                      <User className="h-4 w-4 mr-2" />
                      Switch to Customer
                    </DropdownMenuItem>
                  )}
                  
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center space-x-2">
              <Button variant="ghost" onClick={() => setLoginOpen(true)}>
                Sign In
              </Button>
              {/* Removed Get Started button since signup is now part of login */}
              <LoginPage open={loginOpen} onOpenChange={setLoginOpen} />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}