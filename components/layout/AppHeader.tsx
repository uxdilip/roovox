"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Smartphone, User, LogOut, Settings, MapPin, ChevronDown, Search, Bell, Menu, X } from 'lucide-react';
import { useLocation } from '@/contexts/LocationContext';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import LocationSelector from '@/components/LocationSelector';

export function AppHeader() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { location } = useLocation();
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // TODO: Implement search functionality
      console.log('Searching for:', searchQuery);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <Smartphone className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Roovox
          </span>
        </Link>

        {/* Search Bar - Desktop */}
        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <form onSubmit={handleSearch} className="w-full">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search for services, providers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg border-none focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>
          </form>
        </div>

        {/* Right side: location, notifications, and user */}
        <div className="flex items-center space-x-3">
          {/* Location Selector */}
          <button
            className="hidden sm:flex items-center space-x-1 text-sm font-medium text-gray-700 cursor-pointer bg-transparent border-none outline-none"
            onClick={() => setLocationModalOpen(true)}
          >
            <MapPin className="h-4 w-4 text-primary" />
            <span className="hidden sm:inline">{location?.city || 'Location'}</span>
            <ChevronDown className="h-3 w-3 ml-1 text-gray-400" />
          </button>

          {/* Notifications */}
          <Button variant="ghost" size="sm" className="hidden sm:flex">
            <Bell className="h-4 w-4" />
          </Button>

          {/* User Menu */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback>{user.name?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline">{user.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href="/customer/dashboard">
                    <User className="h-4 w-4 mr-2" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/customer/bookings">
                    <Settings className="h-4 w-4 mr-2" />
                    My Bookings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild size="sm">
              <Link href="/login">Sign In</Link>
            </Button>
          )}

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="absolute top-16 left-0 right-0 bg-white border-b md:hidden">
            <div className="container py-4 space-y-4">
              {/* Mobile Search */}
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search for services..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg border-none focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>
              </form>

              {/* Mobile Navigation */}
              <nav className="flex flex-col space-y-2">
                <Link 
                  href="/customer/dashboard" 
                  className="px-4 py-2 text-sm font-medium hover:text-primary transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link 
                  href="/customer/bookings" 
                  className="px-4 py-2 text-sm font-medium hover:text-primary transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  My Bookings
                </Link>
                <Link 
                  href="/book" 
                  className="px-4 py-2 text-sm font-medium hover:text-primary transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Book Service
                </Link>
              </nav>

              {/* Mobile Location */}
              <div className="px-4">
                <button
                  className="flex items-center space-x-1 text-sm font-medium text-gray-700 w-full"
                  onClick={() => {
                    setLocationModalOpen(true);
                    setMobileMenuOpen(false);
                  }}
                >
                  <MapPin className="h-4 w-4 text-primary" />
                  <span>{location?.city || 'Select Location'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Location Modal */}
        <Dialog open={locationModalOpen} onOpenChange={setLocationModalOpen}>
          <DialogContent className="max-w-md w-full p-0 rounded-lg overflow-hidden">
            <LocationSelector onClose={() => setLocationModalOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>
    </header>
  );
} 