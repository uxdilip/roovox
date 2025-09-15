"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DeviceSelector from '@/components/booking/DeviceSelector';
import { ServiceSelector } from '@/components/booking/ServiceSelector';
import { BookingForm } from '@/components/booking/BookingForm';
import { ProviderSelector } from '@/components/booking/ProviderSelector';
import { Device, Service, PartQuality } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from '@/contexts/LocationContext';
import { NoSSR } from '@/components/ui/NoSSR';
import { getOffersForConversation, getOfferById } from '@/lib/offer-services';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { MapPin, Briefcase, Lock } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import LocationSelector from '@/components/LocationSelector';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { StoreMap } from '@/components/ui/StoreMap';

// Force dynamic rendering to prevent SSR issues
export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export default function BookPage() {
  const { user, isLoading } = useAuth();
  const { location } = useLocation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [selectedServices, setSelectedServices] = useState<Service[] | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<any | null>(null);
  const [selectedPartQuality, setSelectedPartQuality] = useState<PartQuality | null>(null);
  const [selectedIssuesWithPartType, setSelectedIssuesWithPartType] = useState<{ id: string; partType?: string }[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [deviceSelectorKey, setDeviceSelectorKey] = useState(0); // Force DeviceSelector reset
  
  // NEW: Offer context state
  const [offerData, setOfferData] = useState<any>(null);
  const [isFromOffer, setIsFromOffer] = useState(false);
  const [offerMode, setOfferMode] = useState<'normal' | 'from_offer'>('normal');
  const [offerLoading, setOfferLoading] = useState(false);

  // NEW: Booking form specific state
  const [selectedDate, setSelectedDate] = useState<string>('');
  
  // Set a default date (today) to ensure we always have a valid date
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    console.log('🔍 [BOOK] Setting default date:', today);
    setSelectedDate(today);
  }, []); // Only run once on mount
  const [timeSlot, setTimeSlot] = useState<string>('');
  const [serviceMode, setServiceMode] = useState<'doorstep' | 'instore'>('doorstep');
  const [phone, setPhone] = useState<string>('');
  const [additionalNotes, setAdditionalNotes] = useState<string>('');
  const [address, setAddress] = useState<{ street: string; city: string; state: string; zip: string; coordinates?: [number, number] }>({ street: '', city: '', state: '', zip: '' }); // Added for doorstep service
  const [locationModalOpen, setLocationModalOpen] = useState(false); // State for location modal
  
  // Provider location state for instore service
  const [providerLocation, setProviderLocation] = useState<any>(null);
  const [providerLocationLoading, setProviderLocationLoading] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Initialize phone from user data
  useEffect(() => {
    if (user?.phone) {
      setPhone(user.phone);
    }
  }, [user?.phone]);

  // NEW: Detect offer context from URL parameters (client-side only)
  useEffect(() => {
    if (!isClient) return;
    
    const offerId = searchParams.get('offer_id');
    const mode = searchParams.get('mode');
    
    if (offerId && mode === 'from_offer') {
      console.log('🎯 Offer context detected:', { offerId, mode });
      setOfferMode('from_offer');
      setIsFromOffer(true);
      fetchOfferData(offerId);
    }
  }, [searchParams, isClient]);

  // NEW: Fetch offer data when offer context is detected
  const fetchOfferData = async (offerId: string) => {
    if (!user) return;
    
    setOfferLoading(true);
    try {
      const offer = await getOfferById(offerId);
      if (offer.success && offer.offer) {
        setOfferData(offer.offer);
        console.log('✅ Offer data loaded:', offer.offer);
        
        // Pre-fill form with offer data
        if (offer.offer.conversation_context?.device_info) {
          setSelectedDevice(offer.offer.conversation_context.device_info);
        }
        if (offer.offer.conversation_context?.services) {
          setSelectedServices(offer.offer.conversation_context.services);
        }
        if (offer.offer.provider_id) {
          setSelectedProvider({ id: offer.offer.provider_id, name: 'Provider from Offer' });
          // Fetch provider details
          fetchProviderDetails(offer.offer.provider_id);
        }
        if (offer.offer.conversation_context?.part_quality) {
          setSelectedPartQuality(offer.offer.conversation_context.part_quality);
        }
      }
    } catch (error) {
      console.error('❌ Error fetching offer data:', error);
    } finally {
      setOfferLoading(false);
    }
  };

  // NEW: Fetch provider details and location
  const fetchProviderDetails = async (providerId: string) => {
    if (!providerId) return;
    
    setProviderLocationLoading(true);
    try {
      // Fetch real provider data from business_setup collection
      const { databases, DATABASE_ID } = await import('@/lib/appwrite');
      const { Query } = await import('appwrite');
      
      const businessSetupResponse = await databases.listDocuments(
        DATABASE_ID,
        'business_setup',
        [Query.equal('user_id', providerId), Query.limit(1)]
      );
      
      if (businessSetupResponse.documents.length > 0) {
        const businessSetup = businessSetupResponse.documents[0];
        let onboardingData: any = {};
        
        try {
          onboardingData = JSON.parse(businessSetup.onboarding_data || '{}');
        } catch (parseError) {
          console.error('Error parsing onboarding data:', parseError);
        }
        
        // Extract business information from onboarding data
        const businessInfo = onboardingData.businessInfo || {};
        const personalDetails = onboardingData.personalDetails || {};
        const serviceSetup = onboardingData.serviceSetup || {};
        
        // Get provider details
        const providerData = {
          business_name: businessInfo.businessName || 'Provider Store',
          name: businessInfo.businessName || personalDetails.fullName || 'Provider Store',
          address: serviceSetup.location?.address || businessInfo.address || 'Address not available',
          phone: personalDetails.mobile || personalDetails.phone || 'Phone not available',
          business_hours: serviceSetup.availability ? 
            Object.entries(serviceSetup.availability)
              .filter(([_, val]: [string, any]) => val.available)
              .map(([day, val]: [string, any]) => `${day.charAt(0).toUpperCase() + day.slice(1)}: ${val.start} - ${val.end}`)
              .join(', ') : 'Business hours not available',
          email: personalDetails.email || 'Email not available',
          city: serviceSetup.location?.city || 'City not available',
          state: serviceSetup.location?.state || 'State not available'
        };
        
        // Get location coordinates if available
        let locationData = null;
        if (serviceSetup.location?.coordinates) {
          locationData = {
            lat: serviceSetup.location.coordinates[0],
            lng: serviceSetup.location.coordinates[1],
            address: serviceSetup.location.address || providerData.address
          };
        }
        
        // Update provider state with real data
        setSelectedProvider((prev: any) => ({ ...prev, ...providerData }));
        
        if (locationData) {
          setProviderLocation(locationData);
        }
        
        console.log('✅ Real provider data loaded:', providerData);
        if (locationData) {
          console.log('✅ Provider location loaded:', locationData);
        }
      } else {
        console.log('⚠️ No business setup found for provider:', providerId);
        // Fallback to basic provider info
        setSelectedProvider((prev: any) => ({ 
          ...prev, 
          business_name: 'Provider Store',
          name: 'Provider Store',
          address: 'Address not available',
          phone: 'Phone not available',
          business_hours: 'Business hours not available',
          email: 'Email not available'
        }));
      }
    } catch (error) {
      console.error('❌ Error fetching provider details:', error);
      // Fallback to basic provider info on error
      setSelectedProvider((prev: any) => ({ 
        ...prev, 
        business_name: 'Provider Store',
        name: 'Provider Store',
        address: 'Address not available',
        phone: 'Phone not available',
        business_hours: 'Business hours not available',
        email: 'Email not available'
      }));
    } finally {
      setProviderLocationLoading(false);
    }
  };

  // NEW: Pre-fill form when offer data is loaded
  useEffect(() => {
    if (offerData && isFromOffer) {
      console.log('🎯 Pre-filling form with offer data:', offerData);
      
      // Skip steps 1-3, go directly to step 4 (booking form)
      setStep(4);
      
      // Ensure we have a valid date set
      if (!selectedDate) {
        const today = new Date().toISOString().split('T')[0];
        console.log('🔍 [BOOK] Setting date for offer form:', today);
        setSelectedDate(today);
      }
      
              // Pre-fill device info from conversation context
        if (offerData.conversation_context?.device_info) {
          const deviceInfo = offerData.conversation_context.device_info;
          setSelectedDevice({
            id: deviceInfo.category,
            category: deviceInfo.category,
            brand: deviceInfo.brand || 'Device',
            model: deviceInfo.model || 'Model',
            specifications: {},
            common_issues: []
          });
        }
      
      // Pre-fill services from conversation context
      if (offerData.conversation_context?.services) {
        const conversationServices = offerData.conversation_context.services;
        const mockServices = conversationServices.map((service: string, index: number) => ({
          id: `service-${index}`,
          name: service,
          description: service,
          base_price: 0, // Will be overridden by offer price
          device_id: offerData.conversation_context?.device_info?.category || 'phone',
          part_qualities: []
        }));
        setSelectedServices(mockServices);
      }
      
      // Pre-fill provider
      if (offerData.provider_id) {
        setSelectedProvider({
          id: offerData.provider_id,
          name: 'Provider from Offer',
          matchingServices: offerData.selected_services || []
        });
      }
      
      // Pre-fill part quality based on offer
      if (offerData.parts_type) {
        const isOEM = offerData.parts_type.toLowerCase().includes('oem');
        setSelectedPartQuality({
          tier: isOEM ? 'oem' : 'hq',
          price_multiplier: 1,
          warranty_days: parseInt(offerData.warranty) || 30
        });
      }
      
      console.log('✅ Form pre-filled successfully');
    }
  }, [offerData, isFromOffer]);

  const handleDeviceSelect = (device: Device) => {
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

  // Contextual back navigation handler
  const handleServiceSelectorBack = () => {
    setSelectedDevice(null);
    setDeviceSelectorKey(prev => prev + 1); // Force DeviceSelector to reset
    setStep(1);
  };

  const handleBookingSubmit = (bookingData: any) => {
    console.log('📝 Booking data submitted:', bookingData);
    
    // NEW: Handle offer-based booking differently
    if (isFromOffer && offerData) {
      console.log('🎯 Processing offer-based booking');
      
      // Merge offer data with form data
      const enhancedBookingData = {
        ...bookingData,
        // Override with offer terms
        total_amount: parseInt(offerData.price.replace(/[^\d]/g, '')), // Extract numeric price
        selected_services: offerData.selected_services,
        parts_quality: offerData.parts_type,
        warranty: offerData.warranty,
        timeline: offerData.timeline,
        // Add offer reference
        offer_id: offerData.id,
        offer_accepted_at: new Date().toISOString(),
        // Ensure provider ID from offer
        provider_id: offerData.provider_id
      };
      
      console.log('✨ Enhanced booking data:', enhancedBookingData);
      
      // Store enhanced booking data in sessionStorage (client-side only)
      if (typeof window !== 'undefined') {
        try {
          const sessionKey = `pending_booking_${Date.now()}`;
          window.sessionStorage.setItem(sessionKey, JSON.stringify(enhancedBookingData));
          console.log('💾 Enhanced booking data stored in session:', sessionKey);
          
          // Redirect to payment page with session key
          router.push(`/payment?session=${sessionKey}&amount=${enhancedBookingData.total_amount}`);
        } catch (error) {
          console.error('❌ Error storing booking data:', error);
        }
      } else {
        console.error('❌ Window not available - cannot store booking data');
      }
      
    } else {
      console.log('📝 Normal booking flow');
      // TODO: Implement normal booking submission
      // For now, just log the data
    }
  };

  const handleSubmitBooking = () => {
    // Validate required fields
    if (!selectedDate || !timeSlot || !phone.trim()) {
      alert('Please fill all required fields');
      return;
    }

    // Additional validation for doorstep service
    if (serviceMode === 'doorstep' && !address.street.trim()) {
      alert('Please enter your street address for doorstep service');
      return;
    }

    // Validate user session before proceeding
    if (!user || !user.id) {
      console.error('❌ User not authenticated or missing ID:', user);
      alert('Please log in to continue with the booking');
      return;
    }

    // Validate provider selection
    if (!selectedProvider || !selectedProvider.id) {
      console.error('❌ Provider not selected or missing ID:', selectedProvider);
      alert('Please select a provider to continue');
      return;
    }

    // Validate device and services
    if (!selectedDevice || !selectedServices || selectedServices.length === 0) {
      console.error('❌ Device or services not selected:', { selectedDevice, selectedServices });
      alert('Please select a device and services to continue');
      return;
    }

    // Validate date and time
    console.log('🔍 [BOOK] Validation check - selectedDate:', selectedDate, 'timeSlot:', timeSlot);
    
    // Ensure we have a valid date - if not, set to today
    if (!selectedDate || selectedDate.trim() === '') {
      const today = new Date().toISOString().split('T')[0];
      console.log('🔍 [BOOK] Date was empty, setting to today:', today);
      setSelectedDate(today);
      // Don't return, continue with the form submission
    }
    
    // Final validation
    if (!selectedDate || selectedDate.trim() === '') {
      console.error('❌ Date still not set after fallback:', { selectedDate });
      alert('Please select a preferred date to continue');
      return;
    }

    if (!timeSlot) {
      console.error('❌ Time not selected:', { timeSlot });
      alert('Please select a preferred time to continue');
      return;
    }

          console.log('📝 Booking data submitted from Fiverr-style form:', {
        date: selectedDate,
        time: timeSlot,
        serviceMode: serviceMode,
        phone: phone,
        address: address,
        additionalNotes: additionalNotes,
        offerData: offerData,
        selectedDevice: selectedDevice,
        selectedServices: selectedServices,
        selectedProvider: selectedProvider,
        selectedPartQuality: selectedPartQuality,
        selectedIssues: selectedIssuesWithPartType,
      });
      
      // ✅ DEBUG: Log device info for troubleshooting
      console.log('🔍 [BOOK] Device info debug:', {
        offerData_device_info: offerData?.conversation_context?.device_info,
        selectedDevice: selectedDevice,
        final_device_info: (() => {
          if (offerData?.conversation_context?.device_info) {
            const deviceInfo = offerData.conversation_context.device_info;
            return {
              brand: deviceInfo.brand || 'Unknown Brand',
              model: deviceInfo.model || 'Unknown Model',
              category: deviceInfo.category || 'phone'
            };
          }
          if (selectedDevice) {
            return {
              brand: selectedDevice.brand,
              model: selectedDevice.model,
              category: selectedDevice.category
            };
          }
          return { brand: 'Smartphone', model: 'Device', category: 'phone' };
        })()
      });

    try {
      console.log('🔍 [BOOK] Creating booking data with values:', {
        selectedDate,
        timeSlot,
        user: user?.id,
        selectedProvider: selectedProvider?.id,
        selectedDevice: selectedDevice?.id,
        selectedServices: selectedServices?.[0]?.id
      });
      
      // ✅ FIXED: Store booking data in sessionStorage for payment page
      const bookingData = {
        // REQUIRED FIELDS for Appwrite bookings collection
        customer_id: user?.id,
        provider_id: selectedProvider?.id,
        total_amount: offerData ? parseFloat(offerData.price.replace(/[^0-9.]/g, '')) : 0,
        
        // ✅ FIXED: Store actual device information instead of generic device_id
        device_id: selectedDevice?.id || 'phone', // Keep for database compatibility
        device_info: (() => {
          // ✅ FIXED: Prioritize offer data over selectedDevice for accurate device info
          if (offerData?.conversation_context?.device_info) {
            const deviceInfo = offerData.conversation_context.device_info;
            return JSON.stringify({
              brand: deviceInfo.brand || 'Unknown Brand',
              model: deviceInfo.model || 'Unknown Model',
              category: deviceInfo.category || 'phone'
            });
          }
          
          // Fallback to selectedDevice if available
          if (selectedDevice) {
            return JSON.stringify({
              brand: selectedDevice.brand,
              model: selectedDevice.model,
              category: selectedDevice.category
            });
          }
          
          // Final fallback
          return JSON.stringify({ brand: 'Smartphone', model: 'Device', category: 'phone' });
        })(),
        
        service_id: selectedServices?.[0]?.id || 'tier-pricing-service', // Default service ID for tier pricing
        payment_method: 'pending',
        status: 'pending',
        payment_status: 'pending',
        
        // Database expects these specific field names
        date: selectedDate,
        time: timeSlot,
        
        // Additional data for the booking
        selectedDevice: selectedDevice,
        selectedServices: selectedServices,
        selectedPartQuality: selectedPartQuality,
        selectedIssues: selectedIssuesWithPartType,
        serviceMode: serviceMode,
        phone: phone,
        address: address,
        additionalNotes: additionalNotes,
        offerData: offerData,
        price: offerData ? parseFloat(offerData.price.replace(/[^0-9.]/g, '')) : 0,
        offerId: offerData?.id,
        isFromOffer: true,
        issue_description: selectedServices?.join(', ') || 'Service requested',
        selected_issues: JSON.stringify(selectedServices || []),
        location_type: serviceMode === 'doorstep' ? 'doorstep' : 'provider_location', // Map to database enum values
        warranty: 'Standard warranty',
        
        // Map phone to customer_phone for database
        customer_phone: phone,
        customer_address: JSON.stringify(address || {})
      };

      if (typeof window !== 'undefined') {
        console.log('🔍 [BOOK] Final booking data before storage:', {
          selectedDate,
          timeSlot,
          date: selectedDate,
          time: timeSlot,
          fullBookingData: bookingData
        });
        
        // Test the data structure
        const testData = {
          customer_id: bookingData.customer_id,
          provider_id: bookingData.provider_id,
          device_id: bookingData.device_id,
          service_id: bookingData.service_id,
          date: bookingData.date,
          time: bookingData.time,
          location_type: bookingData.location_type
        };
        console.log('🔍 [BOOK] Test data structure:', testData);
        
        sessionStorage.setItem('bookingData', JSON.stringify(bookingData));
        console.log('✅ Booking data stored in sessionStorage');
      }

      // Redirect to payment page
      console.log('🔄 Redirecting to payment page...');
      router.push('/payment');
      
    } catch (error) {
      console.error('❌ Error in handleSubmitBooking:', error);
      alert('There was an error processing your booking. Please try again.');
    }
  };

  // Redirect to login if user is not authenticated (after loading is complete)
  useEffect(() => {
    if (!isLoading && isClient && !user) {
      const currentPath = window.location.pathname + window.location.search;
      const returnUrl = encodeURIComponent(currentPath);
      router.push(`/login?returnUrl=${returnUrl}`);
    }
  }, [isLoading, isClient, user, router]);

  // Show loading while checking authentication or fetching offer data
  if (isLoading || !isClient || (isFromOffer && offerLoading)) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              {isFromOffer && offerLoading ? (
                <p className="text-gray-600">Loading your offer details...</p>
              ) : (
                <p className="text-gray-600">Loading...</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If no user after loading is complete, return null (redirect will happen in useEffect)
  if (!user) {
    return null;
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
        {/* NEW: Show offer context banner when applicable */}
        {isFromOffer && offerData && (
          <div className="bg-blue-50 border-b border-blue-200 py-4">
            <div className="container mx-auto max-w-6xl px-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm font-medium text-blue-800">
                    Booking from Accepted Offer
                  </span>
                </div>
                <div className="text-sm text-blue-600">
                  {offerData.conversation_context?.device_info?.brand} {offerData.conversation_context?.device_info?.model} • {offerData.price}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* NEW: Skip steps 1-3 when coming from offer */}
        {!isFromOffer && (step === 1 || step === 2) && (
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
              {step === 1 && (
                <DeviceSelector 
                  key={deviceSelectorKey}
                  onDeviceSelect={handleDeviceSelect}
                />
              )}
              {step === 2 && selectedDevice && (
                <ServiceSelector
                  device={selectedDevice}
                  onServiceSelect={handleServiceSelect}
                  onBack={handleServiceSelectorBack}
                />
              )}
            </div>
          </div>
        )}
        
        {/* NEW: Skip step 3 when coming from offer */}
        {!isFromOffer && step === 3 && selectedDevice && selectedServices && (
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
        
        {/* NEW: Enhanced step 4 with beautiful Fiverr-style design */}
        {step === 4 && selectedDevice && selectedServices && selectedProvider && (
          <div className="min-h-screen bg-gray-50">
            <div className="max-w-6xl mx-auto px-4 py-8">
              {isFromOffer && offerData ? (
                /* Beautiful Offer-Based Booking Form */
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Main Form - Left Column */}
                  <div className="lg:col-span-2">
                    <Card className="border-0 shadow-lg">
                      <CardHeader className="border-b pb-6">
                        <div className="text-center">
                          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                            <Briefcase className="h-8 w-8 text-blue-600" />
                          </div>
                          <CardTitle className="text-2xl font-bold text-gray-900">
                            Complete Your Booking
                          </CardTitle>
                          <p className="text-gray-600 text-lg mt-2">
                            Just a few details to finalize your service appointment
                          </p>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="p-8">
                        <div className="space-y-8">
                          {/* Appointment Details */}
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Appointment Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                <Label htmlFor="date" className="text-sm font-medium text-gray-700 mb-2 block">
                                  Preferred Date
                                </Label>
                                <Input
                                  id="date"
                                  type="date"
                                  value={selectedDate}
                                  onChange={(e) => {
                                    // Store the date string directly to avoid timezone issues
                                    console.log('🔍 [BOOK] Date input changed:', {
                                      inputValue: e.target.value,
                                      rawValue: e.target.value,
                                      previousValue: selectedDate
                                    });
                                    setSelectedDate(e.target.value); // Store as string, not Date object
                                    console.log('🔍 [BOOK] Date state updated to:', e.target.value);
                                  }}
                                  min={new Date().toISOString().split('T')[0]}
                                  className="h-12 text-base border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                                <div className="mt-2 text-sm text-gray-500">
                                  Current selectedDate: {selectedDate || 'Not set'}
                                </div>
                              </div>
                              
                              <div>
                                <Label htmlFor="time" className="text-sm font-medium text-gray-700 mb-2 block">
                                  Preferred Time
                                </Label>
                                <select
                                  id="time"
                                  value={timeSlot}
                                  onChange={(e) => setTimeSlot(e.target.value)}
                                  className="w-full h-12 p-3 border border-gray-300 rounded-md text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                  <option value="">Select time</option>
                                  <option value="09:00 AM">09:00 AM</option>
                                  <option value="10:00 AM">10:00 AM</option>
                                  <option value="11:00 AM">11:00 AM</option>
                                  <option value="12:00 PM">12:00 PM</option>
                                  <option value="01:00 PM">01:00 PM</option>
                                  <option value="02:00 PM">02:00 PM</option>
                                  <option value="03:00 PM">03:00 PM</option>
                                  <option value="04:00 PM">04:00 PM</option>
                                  <option value="05:00 PM">05:00 PM</option>
                                  <option value="06:00 PM">06:00 PM</option>
                                </select>
                              </div>
                            </div>
                          </div>

                          {/* Service Mode */}
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Mode</h3>
                            <RadioGroup value={serviceMode} onValueChange={(value: 'doorstep' | 'instore') => setServiceMode(value)}>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className={`flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                                  serviceMode === 'doorstep' 
                                    ? 'border-blue-500 bg-blue-50' 
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}>
                                  <RadioGroupItem value="doorstep" id="doorstep" />
                                  <Label htmlFor="doorstep" className="cursor-pointer flex-1">
                                    <div className="flex items-center gap-3">
                                      <MapPin className="h-5 w-5 text-blue-600" />
                                      <div>
                                        <div className="font-semibold text-gray-900">Door-to-Door Service</div>
                                        <div className="text-sm text-gray-600">We'll pick up, repair & deliver</div>
                                      </div>
                                    </div>
                                  </Label>
                                </div>
                                
                                <div className={`flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                                  serviceMode === 'instore' 
                                    ? 'border-blue-500 bg-blue-50' 
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}>
                                  <RadioGroupItem value="instore" id="instore" />
                                  <Label htmlFor="instore" className="cursor-pointer flex-1">
                                    <div className="flex items-center gap-3">
                                      <Briefcase className="h-5 w-5 text-green-600" />
                                      <div>
                                        <div className="font-semibold text-gray-900">Visit Store</div>
                                        <div className="text-sm text-gray-600">Drop off at provider's location</div>
                                      </div>
                                    </div>
                                  </Label>
                                </div>
                              </div>
                            </RadioGroup>
                          </div>

                          {/* Doorstep Service - Customer Address Form */}
                          {serviceMode === 'doorstep' && (
                            <Card className="border-blue-200 bg-blue-50">
                              <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-blue-900">
                                  <MapPin className="h-5 w-5" />
                                  Address
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-4">
                                <Button 
                                  type="button" 
                                  variant="outline" 
                                  className="mr-2 border-blue-300 text-blue-700 hover:bg-blue-100" 
                                  onClick={() => setLocationModalOpen(true)}
                                >
                                  <MapPin className="h-4 w-4 mr-2" /> Select Location
                                </Button>
                                
                                <div className="space-y-4">
                                  <div>
                                    <Label htmlFor="street" className="text-sm font-medium text-blue-800 mb-2 block">
                                      Street Address
                                    </Label>
                                    <Input
                                      id="street"
                                      placeholder="Enter your street address"
                                      value={address.street}
                                      onChange={(e) => setAddress(prev => ({ ...prev, street: e.target.value }))}
                                      className="border-blue-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                  </div>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                      <Label htmlFor="city" className="text-sm font-medium text-blue-800 mb-2 block">
                                        City
                                      </Label>
                                      <Input
                                        id="city"
                                        placeholder="City"
                                        value={address.city}
                                        onChange={(e) => setAddress(prev => ({ ...prev, city: e.target.value }))}
                                        className="border-blue-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor="state" className="text-sm font-medium text-blue-800 mb-2 block">
                                        State
                                      </Label>
                                      <Input
                                        id="state"
                                        placeholder="State"
                                        value={address.state}
                                        onChange={(e) => setAddress(prev => ({ ...prev, state: e.target.value }))}
                                        className="border-blue-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor="zip" className="text-sm font-medium text-blue-800 mb-2 block">
                                        ZIP Code
                                      </Label>
                                      <Input
                                        id="zip"
                                        placeholder="ZIP Code"
                                        value={address.zip}
                                        onChange={(e) => setAddress(prev => ({ ...prev, zip: e.target.value }))}
                                        className="border-blue-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                      />
                                    </div>
                                  </div>
                                  
                                  {address.coordinates && (
                                    <div className="bg-blue-100 rounded-lg p-3">
                                      <p className="text-sm text-blue-800">
                                        <strong>Selected Location:</strong> {address.coordinates.join(', ')}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          )}

                          {/* Visit Store - Provider Address Display */}
                          {serviceMode === 'instore' && selectedProvider && (
                            <Card className="border-green-200 bg-green-50">
                             
                              <CardContent className="space-y-4">
                               
                                
                                {/* StoreMap Component - Full Interactive Map */}
                                <div className="bg-white rounded-lg p-4 border border-green-200">
                                  <h5 className="font-medium text-green-900 mb-3">Location Map</h5>
                                  {providerLocation ? (
                                    <StoreMap
                                      storeLocation={{
                                        lat: providerLocation.lat,
                                        lng: providerLocation.lng,
                                        address: providerLocation.address || selectedProvider.address,
                                        businessName: selectedProvider.business_name || selectedProvider.name || 'Store',
                                        phone: selectedProvider.phone,
                                        hours: selectedProvider.business_hours
                                      }}
                                      customerLocation={location?.coordinates ? {
                                        lat: location.coordinates[0],
                                        lng: location.coordinates[1]
                                      } : null}
                                      showDirections={true}
                                    />
                                  ) : (
                                    <div className="h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                                      <div className="text-center">
                                        <MapPin className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                        <p className="text-sm text-gray-500">Provider location will be displayed here</p>
                                        <p className="text-xs text-gray-400 mt-1">Map integration ready</p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          )}

                          {/* Contact Details */}
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Details</h3>
                            <div>
                              <Label htmlFor="phone" className="text-sm font-medium text-gray-700 mb-2 block">
                                Phone Number
                              </Label>
                              <div className="flex gap-3">
                                <Input
                                  id="phone"
                                  value={phone}
                                  onChange={(e) => setPhone(e.target.value)}
                                  placeholder="Enter your phone number"
                                  className="h-12 text-base"
                                />
                                <Button variant="outline" size="sm" className="h-12 px-4">
                                  Edit
                                </Button>
                              </div>
                            </div>
                          </div>

                          {/* Additional Notes */}
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Notes (Optional)</h3>
                            <Textarea
                              placeholder="Any special instructions or additional information..."
                              value={additionalNotes}
                              onChange={(e) => setAdditionalNotes(e.target.value)}
                              rows={3}
                              className="border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  
                  <div className="lg:col-span-1">
                    <Card className="sticky top-6 border-0 shadow-lg">
                      <CardHeader className="border-b pb-4">
                        <CardTitle className="text-xl font-bold text-gray-900">Order Summary</CardTitle>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          {/* Service Details */}
                          <div className="flex items-start gap-3 pb-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <span className="text-blue-600 font-semibold text-sm">
                                {offerData.conversation_context?.device_info?.brand?.charAt(0) || 'D'}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-900 font-medium leading-tight">
                                {offerData.selected_services?.join(', ') || 'Service'}
                              </p>
                              <p className="text-sm text-gray-600 mt-1">
                                {offerData.conversation_context?.device_info?.brand} {offerData.conversation_context?.device_info?.model}
                              </p>
                            </div>
                          </div>

                          <Separator />

                          {/* Price Breakdown */}
                          <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Service</span>
                              <span className="text-gray-900">{offerData.price}</span>
                            </div>
                  
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Service Mode</span>
                              <span className="text-gray-900 capitalize">{serviceMode}</span>
                            </div>
                            
                            <Separator />
                            
                            <div className="flex justify-between text-lg font-bold">
                              <span>Total</span>
                              <span className="text-green-600">{offerData.price}</span>
                            </div>
                          </div>

                          {/* Payment Button */}
                          <Button 
                            onClick={handleSubmitBooking}
                            className="w-full h-12 text-base font-semibold mt-6"
                            size="lg"
                            disabled={!selectedDate || !timeSlot || !phone.trim() || (serviceMode === 'doorstep' && !address.street.trim())}
                          >
                            Proceed to Payment
                          </Button>
                          
                          
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ) : (
                /* Normal Booking Form (existing) */
          <div className="flex flex-col min-h-screen w-full bg-[#f9fafb]">
            <div className="flex-1 flex w-full">
              <div className="w-full">
                <BookingForm
                  device={selectedDevice}
                  service={selectedServices[0]}
                  issues={selectedServices}
                  partQuality={selectedPartQuality || { tier: 'oem', price_multiplier: 1, warranty_days: 180 }}
                  onSubmit={handleBookingSubmit}
                        onBack={isFromOffer ? () => router.push('/chat') : () => setStep(3)}
                  phone={user?.phone}
                  address={user?.address}
                  providerId={selectedProvider.id}
                        providerPrice={isFromOffer && offerData ? offerData.price : (selectedProvider.pricing?.base_rate || selectedProvider.price)}
                  providerServices={selectedProvider.matchingServices || []}
                  selectedIssues={selectedIssuesWithPartType}
                />
              </div>
            </div>
          </div>
        )}
            </div>
          </div>
        )}

        {/* Location Selection Modal */}
        <Dialog open={locationModalOpen} onOpenChange={setLocationModalOpen}>
          <DialogContent className="max-w-md w-full p-0 rounded-lg overflow-hidden">
            <LocationSelector 
              onClose={() => setLocationModalOpen(false)} 
              onSelect={(item: any) => {
                const isReverseGeocode = !!item.osm_id;
                const addressObj = item.address || {};
                const lat = parseFloat(item.lat || (item.latlng && item.latlng.lat) || (item.geometry && item.geometry.lat) || 0);
                const lon = parseFloat(item.lon || (item.latlng && item.latlng.lng) || (item.geometry && item.geometry.lng) || 0);
                
                setAddress(prev => ({
                  ...prev,
                  street: addressObj.road || addressObj.pedestrian || addressObj.neighbourhood || addressObj.suburb || '',
                  city: addressObj.city || addressObj.town || addressObj.village || addressObj.hamlet || '',
                  state: addressObj.state || '',
                  zip: addressObj.postcode || '',
                  coordinates: [lat, lon]
                }));
                
                setLocationModalOpen(false);
              }}
            />
          </DialogContent>
        </Dialog>
      </>
    </NoSSR>
  );
}