"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getCustomerByUserId, getBusinessSetupByUserId } from '@/lib/appwrite-services';
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
import { Logo } from '@/components/ui/Logo';
import { 
  User, 
  LogOut, 
  MapPin, 
  ChevronDown, 
  Search,
  Bell,
  Home,
  Wrench,
  Menu,
  X,
  Calendar,
  MessageCircle
} from 'lucide-react';

import { useLocation } from '@/contexts/LocationContext';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import LocationSelector from '@/components/LocationSelector';
import { BusinessNotificationBell } from '@/components/ui/business-notification-bell';
import { MessageNotificationEnvelope } from '@/components/ui/message-notification-envelope';

export function Header() {
  const { user, logout, isLoading, activeRole } = useAuth();
  const router = useRouter();
  const { location } = useLocation();
  
  // State
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [isLoadingName, setIsLoadingName] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Smart logo navigation based on user role
  const getLogoHref = () => {
    if (!user) return '/'; // Public home for non-authenticated users
    return activeRole === 'provider' ? '/provider/dashboard' : '/'; // Customers go to home page
  };

  // Smart chat navigation based on user role
  const getChatHref = () => {
    if (!user) return '/login'; // Non-authenticated users go to login
    return activeRole === 'provider' ? '/provider/dashboard?tab=chat' : '/chat'; // Providers go to dashboard chat tab, customers go to chat page
  };

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
          setDisplayName(customerData?.full_name || user.name);
        } else if (activeRole === 'provider') {
          const businessSetup = await getBusinessSetupByUserId(user.id);
          if (businessSetup?.onboarding_data) {
            try {
              const onboardingData = JSON.parse(businessSetup.onboarding_data);
              setDisplayName(onboardingData?.businessInfo?.businessName || user.name);
            } catch (error) {
              setDisplayName(user.name);
            }
          } else {
            setDisplayName(user.name);
          }
        } else {
          setDisplayName(user.name);
        }
      } catch (error) {
        setDisplayName(user.name);
      } finally {
        setIsLoadingName(false);
      }
    };

    fetchDisplayName();
  }, [user, activeRole]);

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          
          {/* Logo Section */}
          <div className="flex items-center">
            <Logo href={getLogoHref()} size="md" />
          </div>

          {/* Center Section - Navigation or Search (Hidden on mobile) */}
          <div className="hidden md:flex flex-1 justify-center px-4">
            {user ? (
              // Logged in users see search bar
              <div className="w-full max-w-2xl">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search for services..."
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
              </div>
            ) : !isLoading ? (
              // Non-logged in users see empty center
              <div className="flex-1" />
            ) : (
              <div className="flex-1" />
            )}
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-2 md:space-x-3">
            
            {/* Location Selector - Hidden on mobile */}
            <button
              className="hidden sm:flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              onClick={() => setLocationModalOpen(true)}
            >
              <MapPin className="h-4 w-4 text-primary" />
              <span className="hidden sm:inline">{location?.city || 'Select Location'}</span>
              <ChevronDown className="h-3 w-3 text-gray-400" />
            </button>

            {/* Loading State */}
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
                <div className="hidden sm:block w-20 h-4 bg-gray-200 rounded animate-pulse" />
              </div>
            ) : user ? (
              // Logged in user menu
              <div className="flex items-center space-x-2 md:space-x-3">
                
                {/* Messages - Hidden on mobile */}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="hidden sm:flex relative"
                  onClick={() => router.push(getChatHref())}
                >
                  <MessageCircle className="h-4 w-4" />
                </Button>

                {/* Notifications - Hidden on mobile */}
                <BusinessNotificationBell variant="default" />
                <MessageNotificationEnvelope variant="default" />

                {/* User Menu - Hidden on mobile */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="hidden md:flex items-center space-x-2 hover:bg-gray-100">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="" alt={displayName} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {isLoadingName ? '...' : displayName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="hidden lg:flex flex-col items-start">
                        <span className="text-sm font-medium text-gray-900">
                          {isLoadingName ? 'Loading...' : displayName}
                        </span>
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className="text-xs">
                            {activeRole === 'provider' ? 'Provider' : 'Customer'}
                          </Badge>
                        </div>
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
                    
                    {/* Messages - Available for all logged-in users */}
                    <DropdownMenuItem asChild>
                      <Link href={getChatHref()} className="flex items-center">
                        <MessageCircle className="mr-2 h-4 w-4" />
                        Messages
                      </Link>
                    </DropdownMenuItem>

                    {/* Role-specific menu items */}
                    {activeRole === 'customer' && (
                      <DropdownMenuItem asChild>
                        <Link href="/customer/my-bookings" className="flex items-center">
                          <Calendar className="mr-2 h-4 w-4" />
                          My Bookings
                        </Link>
                      </DropdownMenuItem>
                    )}
                    
                    {activeRole === 'provider' && (
                      <DropdownMenuItem asChild>
                        <Link href="/provider/dashboard" className="flex items-center">
                          <Home className="mr-2 h-4 w-4" />
                          Dashboard
                        </Link>
                      </DropdownMenuItem>
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
              // Non-logged in user buttons (Hidden on mobile)
              <div className="hidden md:flex items-center space-x-2">
                <Button variant="ghost" onClick={() => router.push('/login')}>
                  Sign In
                </Button>
                <Button variant="outline" onClick={() => router.push('/providers')}>
                  Become a Provider
                </Button>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Search Bar - Show below header on mobile */}
        {user && (
          <div className="md:hidden pb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search for services..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
          </div>
        )}

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-white">
            <div className="py-4 space-y-4">
              {/* Location Selector */}
              <button
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors w-full"
                onClick={() => {
                  setLocationModalOpen(true);
                  closeMobileMenu();
                }}
              >
                <MapPin className="h-4 w-4 text-primary" />
                <span>{location?.city || 'Select Location'}</span>
                <ChevronDown className="h-3 w-3 text-gray-400 ml-auto" />
              </button>

              {user ? (
                // Logged in user mobile menu
                <div className="space-y-2">
                  {/* Messages */}
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start"
                    onClick={() => {
                      router.push(getChatHref());
                      closeMobileMenu();
                    }}
                  >
                    <MessageCircle className="h-4 w-4 mr-3" />
                    Messages
                  </Button>

                                  {/* Notifications */}
                <BusinessNotificationBell variant="mobile" />
                <MessageNotificationEnvelope variant="mobile" />

                  {/* User Info */}
                  <div className="px-4 py-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src="" alt={displayName} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {isLoadingName ? '...' : displayName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {isLoadingName ? 'Loading...' : displayName}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">
                          {activeRole}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Navigation Links */}
                  <div className="space-y-1">
                    {activeRole === 'customer' && (
                      <Link
                        href="/customer/my-bookings"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        onClick={closeMobileMenu}
                      >
                        <Calendar className="h-4 w-4 mr-3" />
                        My Bookings
                      </Link>
                    )}
                    
                    {activeRole === 'provider' && (
                      <Link
                        href="/provider/dashboard"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        onClick={closeMobileMenu}
                      >
                        <Home className="h-4 w-4 mr-3" />
                        Dashboard
                      </Link>
                    )}

                    {/* Logout */}
                    <button
                      onClick={handleLogout}
                      className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors w-full"
                    >
                      <LogOut className="h-4 w-4 mr-3" />
                      Logout
                    </button>
                  </div>
                </div>
              ) : (
                // Non-logged in user mobile menu
                <div className="space-y-2">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start"
                    onClick={() => {
                      router.push('/login');
                      closeMobileMenu();
                    }}
                  >
                    Sign In
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => {
                      router.push('/providers');
                      closeMobileMenu();
                    }}
                  >
                    Become a Provider
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Location Modal */}
      <Dialog open={locationModalOpen} onOpenChange={setLocationModalOpen}>
        <DialogContent className="max-w-md w-full p-0 rounded-lg overflow-hidden">
          <LocationSelector onClose={() => setLocationModalOpen(false)} />
        </DialogContent>
      </Dialog>
    </header>
  );
}