"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Smartphone, MapPin, ChevronDown, Menu, X } from 'lucide-react';
import { useLocation } from '@/contexts/LocationContext';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import LocationSelector from '@/components/LocationSelector';

export function MarketingHeader() {
  const { location } = useLocation();
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <Smartphone className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Roovox
          </span>
        </Link>

        {/* Desktop Navigation */}
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

        {/* Right side: location and CTA buttons */}
        <div className="flex items-center space-x-4">
          {/* Location Selector */}
          <button
            className="hidden sm:flex items-center space-x-1 text-sm font-medium text-gray-700 cursor-pointer bg-transparent border-none outline-none"
            onClick={() => setLocationModalOpen(true)}
          >
            <MapPin className="h-4 w-4 text-primary" />
            <span>{location?.city || 'Select Location'}</span>
            <ChevronDown className="h-3 w-3 ml-1 text-gray-400" />
          </button>

          {/* CTA Buttons */}
          <div className="hidden sm:flex items-center space-x-2">
            <Button variant="ghost" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Get Started</Link>
            </Button>
          </div>

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
              <nav className="flex flex-col space-y-2">
                <Link 
                  href="/services" 
                  className="px-4 py-2 text-sm font-medium hover:text-primary transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Services
                </Link>
                <Link 
                  href="/providers" 
                  className="px-4 py-2 text-sm font-medium hover:text-primary transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Providers
                </Link>
                <Link 
                  href="/how-it-works" 
                  className="px-4 py-2 text-sm font-medium hover:text-primary transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  How It Works
                </Link>
              </nav>
              
              <div className="px-4 space-y-2">
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
                
                <div className="flex flex-col space-y-2 pt-2">
                  <Button variant="ghost" asChild className="justify-start">
                    <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                      Sign In
                    </Link>
                  </Button>
                  <Button asChild className="justify-start">
                    <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                      Get Started
                    </Link>
                  </Button>
                </div>
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