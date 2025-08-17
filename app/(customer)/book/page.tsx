"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DeviceSelector } from '@/components/booking/DeviceSelector';
import { ServiceSelector } from '@/components/booking/ServiceSelector';
import { BookingForm } from '@/components/booking/BookingForm';
import { ProviderSelector } from '@/components/booking/ProviderSelector';
import { Device, Service, PartQuality } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from '@/contexts/LocationContext';
import { NoSSR } from '@/components/ui/NoSSR';

// Force dynamic rendering to prevent SSR issues
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default function BookPage() {
  const { user, isLoading } = useAuth();
  const { location } = useLocation();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [selectedServices, setSelectedServices] = useState<Service[] | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<any | null>(null);
  const [selectedPartQuality, setSelectedPartQuality] = useState<PartQuality | null>(null);
  const [selectedIssuesWithPartType, setSelectedIssuesWithPartType] = useState<{ id: string; partType?: string }[]>([]);
  const [isClient, setIsClient] = useState(false);

  // Ensure this component only runs on client side
  if (typeof window === 'undefined') {
    return null;
  }

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleDeviceSelect = (device: Device) => {
    // Check if user is authenticated before proceeding
    if (!user) {
      // Only access window on client side
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname + window.location.search;
        const returnUrl = encodeURIComponent(currentPath);
        router.push(`/login?returnUrl=${returnUrl}`);
      } else {
        router.push('/login');
      }
      return;
    }
    
    setSelectedDevice(device);
    setStep(2);
  };

  const handleServiceSelect = (services: Service[], partQualities: PartQuality[], selectedIssues?: { id: string; partType?: string }[]) => {
    setSelectedServices(services);
    setSelectedPartQuality(partQualities[0]); // Use first part quality
    setSelectedIssuesWithPartType(selectedIssues || []);
    setStep(3);
  };

  const handleProviderSelect = async (provider: any, partQuality?: PartQuality) => {
    console.log('🔍 Selected Provider:', {
      id: provider.id,
      name: provider.name,
      matchingServices: provider.matchingServices,
      matchingServicesCount: provider.matchingServices?.length
    });
    
    setSelectedProvider(provider);
    if (partQuality) {
      setSelectedPartQuality(partQuality);
    }
    setStep(4);
  };

  const handleBookingSubmit = (bookingData: any) => {
    console.log('Booking data:', bookingData);
    // Here you would submit to your backend
  };

  // Show loading while checking authentication
  if (isLoading || !isClient) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    </div>
  );
}