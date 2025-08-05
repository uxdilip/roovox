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
export const runtime = 'edge';

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


  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleDeviceSelect = (device: Device) => {
    // Check if user is authenticated before proceeding
    if (!user) {
      const currentPath = window.location.pathname + window.location.search;
      const returnUrl = encodeURIComponent(currentPath);
      router.push(`/login?returnUrl=${returnUrl}`);
      return;
    }
    
    setSelectedDevice(device);
    setStep(2);
  };

  // Accepts services, partQualities, and selectedIssuesWithPartType
  const handleServiceSelect = (services: Service[], partQualities: PartQuality[], selectedIssues?: { id: string; partType?: string }[]) => {
    setSelectedServices(services);
    setSelectedPartQuality(partQualities[0]); // Use first part quality
    setSelectedIssuesWithPartType(selectedIssues || []);
    setStep(3);
  };

  // Accepts provider and optional partQuality
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
    // Note: Provider selection will be handled in the booking form
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
    <NoSSR fallback={
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    }>
      <>
        {(step === 1 || step === 2) && (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {step === 1 && (
            <DeviceSelector onDeviceSelect={handleDeviceSelect} />
          )}
          {step === 2 && selectedDevice && (
            <ServiceSelector
              device={selectedDevice}
              onServiceSelect={handleServiceSelect}
              onBack={() => setStep(1)}
            />
          )}
            </div>
          </div>
        )}
        
        {step === 3 && selectedDevice && selectedServices && (
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-7xl mx-auto">
              <ProviderSelector
                device={selectedDevice}
                services={selectedServices}
                partQuality={selectedPartQuality || { tier: 'oem', price_multiplier: 1, warranty_days: 180 }}
                onProviderSelect={handleProviderSelect}
                onBack={() => setStep(2)}
                customerLocation={location?.coordinates || null}
                selectedIssues={selectedIssuesWithPartType}
              />
            </div>
          </div>
        )}
        
        {step === 4 && selectedDevice && selectedServices && selectedProvider && (
          <div className="flex flex-col min-h-screen w-full bg-[#f9fafb]">
            <div className="flex-1 flex w-full">
              <div className="w-full">
                  <BookingForm
                    device={selectedDevice}
                  service={selectedServices[0]}
                  issues={selectedServices}
                    partQuality={selectedPartQuality || { tier: 'oem', price_multiplier: 1, warranty_days: 180 }}
                    onSubmit={handleBookingSubmit}
                    onBack={() => setStep(3)}
                    phone={user?.phone}
                    address={user?.address}
                    providerId={selectedProvider.id}
                  providerPrice={selectedProvider.pricing?.base_rate || selectedProvider.price}
                  providerServices={selectedProvider.matchingServices || []}
                  selectedIssues={selectedIssuesWithPartType}
                  />
                  
                  {/* Debug info */}
                  <div style={{ display: 'none' }}>
                    <pre>
                      {JSON.stringify({
                        selectedProvider: {
                          id: selectedProvider.id,
                          matchingServices: selectedProvider.matchingServices,
                          matchingServicesCount: selectedProvider.matchingServices?.length
                        },
                        selectedServices: selectedServices.map(s => ({ id: s.id, name: s.name })),
                        partQuality: selectedPartQuality
                      }, null, 2)}
                    </pre>
                  </div>
              </div>
        </div>
      </div>
        )}
      </>
    </NoSSR>
  );
}