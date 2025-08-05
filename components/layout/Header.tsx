"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { updateUserDocument, getCustomerByUserId, getBusinessSetupByUserId } from '@/lib/appwrite-services';
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
import { Badge } from '@/components/ui/badge';
import { 
  Smartphone, 
  User, 
  LogOut, 
  MapPin, 
  ChevronDown, 
  Search,
  Settings,
  Bell,
  Briefcase,
  Home,
  Calendar,
  Wallet,
  Users as UsersIcon,
  Wrench
} from 'lucide-react';
import LoginModal from '@/components/auth/LoginModal';
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
  const [displayName, setDisplayName] = useState('');
  const [isLoadingName, setIsLoadingName] = useState(false);

  // Fetch role-specific display name
  useEffect(() => {
    const fetchDisplayName = async () => {
      if (!user) {
        setDisplayName('');
        return;
      }

      setIsLoadingName(true);
      try {
        if (activeRole === 'customer') {
          const customerData = await getCustomerByUserId(user.id);
          if (customerData) {
            setDisplayName(customerData.full_name || user.name);
          } else {
            setDisplayName(user.name);
          }
        } else if (activeRole === 'provider') {
          const businessSetup = await getBusinessSetupByUserId(user.id);
          if (businessSetup && businessSetup.onboarding_data) {
            try {
              const onboardingData = JSON.parse(businessSetup.onboarding_data);
              const businessName = onboardingData?.businessInfo?.businessName;
              if (businessName) {
                setDisplayName(businessName);
              } else {
                setDisplayName(user.name);
              }
            } catch (error) {
              console.error('Error parsing business setup data:', error);
              setDisplayName(user.name);
            }
          } else {
            setDisplayName(user.name);
          }
        } else {
          setDisplayName(user.name);
        }
      } catch (error) {
        console.error('Error fetching display name:', error);
        setDisplayName(user.name);
      } finally {
        setIsLoadingName(false);
      }
    };

    fetchDisplayName();
  }, [user, activeRole]);

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



  // Determine logo link based on activeRole
  let logoHref = '/';
  if (activeRole === 'provider') {
    logoHref = '/provider/dashboard';
  }

  // Role-based navigation items
  const getNavigationItems = () => {
    if (!user) return [];
    
    if (activeRole === 'customer') {
      return [
        { href: '/customer/dashboard', label: 'Dashboard', icon: Home },
      ];
    } else if (activeRole === 'provider') {
      return [
        { href: '/provider/dashboard', label: 'Dashboard', icon: Home },
      ];
    }
    return [];
  };



  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo Section */}
          <div className="flex items-center space-x-4">
            <Link 
              href={logoHref} 
              className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
            >
              <div className="relative">
                <Smartphone className="h-8 w-8 text-primary" />
                <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Roovox
              </span>
            </Link>
          </div>

          {/* Center Section - Search Bar or Navigation */}
          <div className="flex-1 flex justify-center px-4">
            {user ? (
              <div className="w-full max-w-2xl">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search for mobiles, accessories & more..."
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
              </div>
            ) : !isLoading ? (
              <nav className="hidden md:flex items-center space-x-8">
                <Link href="/services" className="text-sm font-medium text-gray-700 hover:text-primary transition-colors">
                  Services
                </Link>
                <Link href="/providers" className="text-sm font-medium text-gray-700 hover:text-primary transition-colors">
                  Providers
                </Link>
                <Link href="/how-it-works" className="text-sm font-medium text-gray-700 hover:text-primary transition-colors">
                  How It Works
                </Link>
              </nav>
            ) : (
              <div className="flex-1" />
            )}
          </div>

          {/* Right Section - Location, Notifications, User Menu */}
          <div className="flex items-center space-x-3">
            {/* Location Selector */}
            <button
              className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              onClick={() => setLocationModalOpen(true)}
            >
              <MapPin className="h-4 w-4 text-primary" />
              <span className="hidden sm:inline">{location?.city || 'Select Location'}</span>
              <ChevronDown className="h-3 w-3 text-gray-400" />
            </button>

            {/* Notifications (for logged in users) */}
            {user && (
              <Button variant="ghost" size="sm">
                <Bell className="h-4 w-4" />
              </Button>
            )}

            {/* Loading State */}
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
                <div className="w-20 h-4 bg-gray-200 rounded animate-pulse" />
              </div>
            ) : user ? (
              <div className="flex items-center space-x-3">


                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center space-x-2 hover:bg-gray-100">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="" alt={displayName} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {isLoadingName ? '...' : displayName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="hidden sm:flex flex-col items-start">
                        <span className="text-sm font-medium text-gray-900">
                          {isLoadingName ? 'Loading...' : displayName}
                        </span>
                        <span className="text-xs text-gray-500 capitalize">
                          {activeRole}
                        </span>
                      </div>
                      <ChevronDown className="h-3 w-3 text-gray-400" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{displayName}</p>
                        <p className="text-xs leading-none text-muted-foreground capitalize">
                          {activeRole}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    
                    {/* Role-specific menu items */}
                    {activeRole === 'customer' && (
                      <>
                        <DropdownMenuItem asChild>
                          <Link href="/customer/dashboard" className="flex items-center">
                            <Home className="mr-2 h-4 w-4" />
                            Dashboard
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    
                    {activeRole === 'provider' && (
                      <>
                        <DropdownMenuItem asChild>
                          <Link href="/provider/dashboard" className="flex items-center">
                            <Home className="mr-2 h-4 w-4" />
                            Dashboard
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" onClick={() => setLoginOpen(true)}>
                  Sign In
                </Button>
                <LoginModal 
                  open={loginOpen} 
                  onOpenChange={setLoginOpen}
                  returnUrl={typeof window !== 'undefined' ? window.location.pathname + window.location.search : undefined}
                />
              </div>
            )}
          </div>
        </div>


      </div>

      {/* Location Modal */}
      <Dialog open={locationModalOpen} onOpenChange={setLocationModalOpen}>
        <DialogContent className="max-w-md w-full p-0 rounded-lg overflow-hidden">
          <LocationSelector onClose={() => setLocationModalOpen(false)} onLocationUpdate={handleLocationUpdate} />
        </DialogContent>
      </Dialog>
    </header>
  );
}