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
import { Smartphone, User, LogOut, Settings, Bell, Menu, X, Plus, Calendar } from 'lucide-react';

export function ProviderHeader() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/provider/dashboard" className="flex items-center space-x-2">
          <Smartphone className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Roovox Provider
          </span>
        </Link>

        {/* Quick Actions - Desktop */}
        <div className="hidden md:flex items-center space-x-3">
          <Button variant="outline" size="sm" asChild>
            <Link href="/provider/services">
              <Plus className="h-4 w-4 mr-2" />
              Add Service
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/provider/bookings">
              <Calendar className="h-4 w-4 mr-2" />
              View Bookings
            </Link>
          </Button>
        </div>

        {/* Right side: notifications and user */}
        <div className="flex items-center space-x-3">
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
                    <AvatarFallback>{user.name?.charAt(0) || 'P'}</AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline">{user.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href="/provider/dashboard">
                    <User className="h-4 w-4 mr-2" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/provider/bookings">
                    <Calendar className="h-4 w-4 mr-2" />
                    Bookings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/provider/services">
                    <Settings className="h-4 w-4 mr-2" />
                    Services
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
              <Link href="/provider/login">Sign In</Link>
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
              {/* Mobile Navigation */}
              <nav className="flex flex-col space-y-2">
                <Link 
                  href="/provider/dashboard" 
                  className="px-4 py-2 text-sm font-medium hover:text-primary transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link 
                  href="/provider/bookings" 
                  className="px-4 py-2 text-sm font-medium hover:text-primary transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Bookings
                </Link>
                <Link 
                  href="/provider/services" 
                  className="px-4 py-2 text-sm font-medium hover:text-primary transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Services
                </Link>
              </nav>

              {/* Mobile Quick Actions */}
              <div className="px-4 space-y-2">
                <Button variant="outline" size="sm" asChild className="w-full justify-start">
                  <Link href="/provider/services" onClick={() => setMobileMenuOpen(false)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Service
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild className="w-full justify-start">
                  <Link href="/provider/bookings" onClick={() => setMobileMenuOpen(false)}>
                    <Calendar className="h-4 w-4 mr-2" />
                    View Bookings
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
} 