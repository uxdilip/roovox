"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Users, 
  SlidersHorizontal, 
  ArrowUpDown,
  MapPin,
  Star,
  DollarSign,
  Clock,
  ChevronRight
} from 'lucide-react';
import { Device, Service, PartQuality } from '@/types';
import { databases, DATABASE_ID, COLLECTIONS } from '@/lib/appwrite';
import { ProviderCard } from './ProviderCard';
import { CustomQuoteRequestModal } from './CustomQuoteRequestModal';

import { useAuth } from '@/contexts/AuthContext';
import { Query } from 'appwrite';

// Haversine formula for distance calculation
function haversineDistance([lat1, lng1]: [number, number], [lat2, lng2]: [number, number]) {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Provider interface
type SimpleProvider = {
  id: string;
  name: string;
  businessName: string; // Changed from business_name to businessName to match ProviderCard
  rating: number;
  total_reviews: number;
  experience_years: number;
  specializations: string[];
  distance_km: number;
  estimated_arrival_minutes: number;
  base_price: number;
  availability_status: 'available' | 'busy' | 'offline';
  isVerified: boolean;
  badges: string[];
  profilePicture: string;
  city: string;
  service: string;
  partType: string;
  warranty: string;
  bookingsCount: number;
  avgRating: number | null;
  servicesOffered: any[];
};

interface ProviderSelectorProps {
  device: Device;
  services: Service[];
  partQuality: PartQuality;
  onProviderSelect: (provider: any, partQuality?: PartQuality) => void;
  onBack: () => void;
  customerLocation: [number, number] | null;
  selectedIssues: { id: string; partType?: string }[];
}

export function ProviderSelector({ device, services, partQuality, onProviderSelect, onBack, customerLocation, selectedIssues = [] }: ProviderSelectorProps) {
  const { user } = useAuth();
  const [providers, setProviders] = useState<any[]>([]);
  const [filterQuality, setFilterQuality] = useState<'all' | 'OEM' | 'HQ'>('all');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'distance' | 'experience'>('distance');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [selectedProviderForQuote, setSelectedProviderForQuote] = useState<any>(null);
  const [selectedProvider, setSelectedProvider] = useState<SimpleProvider | null>(null);
  
  // ✅ NEW: Track active conversations for each provider
  const [providerConversations, setProviderConversations] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchProviders = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log('🔍 Starting tier pricing provider search for device:', device);
        console.log('🔍 Services:', services);
        
        // Get issue names from issue IDs
        const issueIds = services.map((s: any) => s.id);
        console.log('🔍 Issue IDs:', issueIds);
        
        // Get issue names from the issues collection
        const issuesRes = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.ISSUES,
          [Query.contains('$id', issueIds)]
        );
        
        const issueNames = issuesRes.documents.map((doc: any) => doc.name);
        console.log('🔍 Looking for providers with issues:', issueNames);

        // Import tier pricing services
        const { getTierPricingForProviders, getDeviceComplexityTier } = await import('@/lib/tier-pricing-services');
        const deviceType = device.category === 'phone' ? 'phones' : 'laptops';
        const deviceTier = await getDeviceComplexityTier(device.id, device.category);
        
        console.log('🔍 Device complexity tier:', deviceTier);

        // Step 1: Find ALL providers who have tier pricing for this device type and brand
        const allTierPricingRes = await databases.listDocuments(
          DATABASE_ID,
          'tier_pricing',
          [
            Query.equal('device_type', deviceType),
            Query.equal('brand', device.brand),
            Query.limit(100)
          ]
        );

        console.log('🔍 Found tier pricing documents:', allTierPricingRes.documents.length);

        // Get unique provider IDs from tier pricing
        const providerIdsWithTierPricing = Array.from(
          new Set(allTierPricingRes.documents.map((doc: any) => doc.provider_id))
        );

        console.log('🔍 Providers with tier pricing:', providerIdsWithTierPricing);

        if (providerIdsWithTierPricing.length === 0) {
          console.log('❌ No providers found with tier pricing for this device');
          setProviders([]);
          setLoading(false);
          return;
        }

        // Step 2: Get provider profiles
        const providersRes = await databases.listDocuments(
          DATABASE_ID,
          'providers',
          [
            Query.contains('providerId', providerIdsWithTierPricing),
            Query.equal('isApproved', true),
            Query.equal('isVerified', true),
            Query.equal('onboardingCompleted', true)
          ]
        );

        console.log('🔍 Found approved providers:', providersRes.documents.length);

        if (providersRes.documents.length === 0) {
          console.log('❌ No approved providers found');
          setProviders([]);
          setLoading(false);
          return;
        }

        // Step 3: Get additional provider data
        const validProviderIds = providersRes.documents.map((p: any) => p.providerId);
        
        const [businessSetups, bookingsRes, usersRes] = await Promise.all([
          // Business setups
          Promise.all(validProviderIds.map(async (pid) => {
            const res = await databases.listDocuments(
              DATABASE_ID,
              "business_setup", // Using exact collection name from dashboard
              [Query.equal('user_id', pid), Query.limit(1)]
            );
            console.log('🔍 Business setup for', pid, ':', res.documents[0]);
            return res.documents[0];
          })),
          // Bookings
          databases.listDocuments(
            DATABASE_ID,
            "bookings", // Using exact collection name from dashboard
            [Query.contains('provider_id', validProviderIds)]
          ),
          // Users
          databases.listDocuments(
            DATABASE_ID,
            "User", // Using exact collection name from dashboard (capital U)
            [Query.contains('user_id', validProviderIds)]
          )
        ]);

        console.log('🔍 Users collection result:', usersRes.documents.length, 'documents');
        console.log('🔍 Business setups result:', businessSetups.filter(b => b).length, 'documents');

        // Step 4: Build provider cards with tier pricing
        const providerCards = validProviderIds.map((pid) => {
          const prov = providersRes.documents.find((p: any) => p.providerId === pid);
          const businessInfo = businessSetups.find((b: any) => b?.user_id === pid);
          const user = usersRes.documents.find((u: any) => u.user_id === pid);
          const serviceSetup = businessInfo?.serviceSetup;

          // Get tier pricing for this provider
          const providerTierPricing = allTierPricingRes.documents.filter(
            (doc: any) => doc.provider_id === pid
          );

          // Filter tier pricing to only include selected issues with part type matching
          const matchingTierServices = providerTierPricing.filter((tierDoc: any) => {
            return issueNames.some(issueName => {
              const issueNameLower = issueName.toLowerCase().trim();
              const tierIssueLower = tierDoc.issue.toLowerCase().trim();
              
              // Handle part type matching for Screen Replacement (using issue name approach)
              const isScreenReplacement = issueNameLower.includes('screen replacement');
              if (isScreenReplacement) {
                // Find the corresponding selected issue to get its part type
                const selectedIssue = selectedIssues.find((si: any) => 
                  (si.name || si.id)?.toLowerCase().trim() === issueNameLower
                );
                
                if (selectedIssue && selectedIssue.partType) {
                  // For screen replacement with part type, match against "Issue (OEM)" or "Issue (HQ)"
                  const expectedTierIssue = `${issueName} (${selectedIssue.partType.toUpperCase()})`.toLowerCase();
                  return tierIssueLower === expectedTierIssue;
                } else {
                  // If no part type specified, match the base issue name
                  return tierIssueLower === issueNameLower;
                }
              }
              
              // For non-screen replacement issues, direct name matching
              return tierIssueLower === issueNameLower;
            });
          });

          console.log('🔍 Provider tier services:', {
            providerId: pid,
            totalTierServices: providerTierPricing.length,
            matchingServices: matchingTierServices.length,
            issues: matchingTierServices.map(s => s.issue)
          });

          if (matchingTierServices.length === 0) {
            console.log('❌ Provider filtered out - no matching tier services:', pid);
            return null;
          }

          // Convert tier pricing to service format
          const matchingServices = matchingTierServices.map((tierDoc: any) => {
            // Extract part type from issue name if it exists (e.g., "Screen Replacement (OEM)")
            const issueMatch = tierDoc.issue.match(/^(.+?)\s*\(([^)]+)\)$/);
            let baseIssue = tierDoc.issue;
            let partType = '';
            
            if (issueMatch) {
              baseIssue = issueMatch[1].trim();
              partType = issueMatch[2].trim();
            }
            
            return {
              issue: baseIssue, // Use base issue name for matching
              price: deviceTier ? tierDoc[deviceTier] : tierDoc.standard,
              pricingType: 'tier_pricing',
              partType: partType, // Extract part type from issue name
              warranty: '30 days', // Default warranty for tier pricing
              tierPrices: {
                basic: tierDoc.basic,
                standard: tierDoc.standard,
                premium: tierDoc.premium
              },
              deviceTier: deviceTier || 'standard'
            };
          });

          // Calculate distance if customer location is available
          let distance = 0;
          if (customerLocation && serviceSetup?.location?.coordinates) {
            const [lat, lng] = serviceSetup.location.coordinates;
            distance = haversineDistance(customerLocation, [lat, lng]);
          }

          // Get availability
          let todayAvailability = 'Not available';
          if (serviceSetup?.availability) {
            const today = new Date().toLocaleString('en-US', { weekday: 'long' });
            const todayAvail = serviceSetup.availability.find((a: any) => a.day === today);
            if (todayAvail && todayAvail.available) {
              todayAvailability = `${todayAvail.start} – ${todayAvail.end}`;
            }
          }

          // Get bookings and ratings
          const providerBookings = bookingsRes.documents.filter((b: any) => b.provider_id === pid);
          const totalBookings = providerBookings.length;
          const ratings = providerBookings.map((b: any) => b.rating).filter((r: any) => typeof r === 'number' && r > 0);
          const avgRating = ratings.length > 0 ? (ratings.reduce((sum: number, r: number) => sum + r, 0) / ratings.length) : null;

          // Parse onboarding_data JSON string to get business details
          let parsedOnboardingData: any = {};
          if (businessInfo?.onboarding_data && typeof businessInfo.onboarding_data === 'string') {
            try {
              parsedOnboardingData = JSON.parse(businessInfo.onboarding_data);
              console.log('🔍 Parsed onboarding data for', pid, ':', parsedOnboardingData);
            } catch (e) {
              console.error('❌ Error parsing onboarding_data for provider', pid, ':', e);
            }
          }

          // Extract business details from parsed onboarding data
          const businessNameFromOnboarding = parsedOnboardingData?.businessInfo?.businessName;
          const experienceFromOnboarding = parsedOnboardingData?.businessInfo?.experience;
          const locationFromOnboarding = parsedOnboardingData?.businessInfo?.address || 
                                       parsedOnboardingData?.businessInfo?.city || 
                                       parsedOnboardingData?.businessInfo?.state;

          // Debug: Log the data we have for this provider
          console.log('🔍 Provider data for', pid, {
            user: user,
            businessInfo: businessInfo,
            serviceSetup: serviceSetup,
            prov: prov,
            totalBookings,
            avgRating
          });

          // Debug: Log specific business name paths
          console.log('🔍 Business name debug for', pid, {
            'businessInfo?.businessInfo?.businessName': businessInfo?.businessInfo?.businessName,
            'businessInfo?.businessName': businessInfo?.businessName,
            'businessInfo?.personalDetails?.businessName': businessInfo?.personalDetails?.businessName,
            'user?.name': (user as any)?.name,
            'businessNameFromOnboarding': businessNameFromOnboarding,
            'experienceFromOnboarding': experienceFromOnboarding,
            'locationFromOnboarding': locationFromOnboarding,
            'businessInfo structure': businessInfo ? Object.keys(businessInfo) : 'null'
          });

          return {
            id: pid,
            name: (user as any)?.name || 'Provider',
            phone: (user as any)?.phone || '-',
            isVerified: prov?.isVerified || false,
            isApproved: prov?.isApproved || false,
            totalBookings,
            rating: avgRating, // This matches what ProviderCard expects
            yearsOfExperience: experienceFromOnboarding || businessInfo?.personalDetails?.experience || 0, // Use parsed onboarding data first
            todayAvailability,
            distance,
            matchingServices,
            businessName: businessNameFromOnboarding || (user as any)?.name || 'Business Name N/A', // Use parsed onboarding data first
            location: locationFromOnboarding || (serviceSetup?.serviceMode === 'instore' && serviceSetup?.location?.address)
              ? serviceSetup.location.address
              : serviceSetup?.location?.city || serviceSetup?.location?.state || 'Location N/A', // Use parsed onboarding data first
            profilePicture: (user as any)?.profilePicture || '',
            serviceMode: serviceSetup?.serviceMode || 'both',
            storeAddress: serviceSetup?.location || null,
          };
        }).filter((p): p is any => !!p);

        console.log('🔍 Final provider cards:', providerCards.length);
        setProviders(providerCards);

      } catch (err) {
        console.error('❌ Error fetching providers:', err);
        setError('Failed to load providers. Please check your filters and try again.');
        setProviders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProviders();
  }, [device, services, customerLocation]);

  // ✅ NEW: Check for active conversations when providers are loaded
  useEffect(() => {
    if (providers.length > 0 && !loading) {
      checkProviderConversations();
    }
  }, [providers, loading]);

  const handleSelectProvider = (provider: SimpleProvider) => {
    // TODO: Open provider profile modal/page
    console.log('🔍 View profile for provider:', provider.id);
  };

  const handleGetQuote = (provider: SimpleProvider) => {
    console.log('🔍 Get quote from provider:', provider.id);
    setSelectedProviderForQuote(provider);
    setIsQuoteModalOpen(true);
  };

  // ✅ NEW: Check for active conversations for all providers
  const checkProviderConversations = async () => {
    if (!user || providers.length === 0) return;
    
    try {
      const { findExistingConversation } = await import('@/lib/chat-services');
      const conversations: Record<string, boolean> = {};
      
      for (const provider of providers) {
        const result = await findExistingConversation(
          user.id,
          provider.id,
          {
            brand: device.brand,
            model: device.model,
            category: device.category as 'phone' | 'laptop'
          }
        );
        
        conversations[provider.id] = result.success && !!result.conversation;
      }
      
      setProviderConversations(conversations);
      console.log('✅ Provider conversations checked:', conversations);
    } catch (error) {
      console.error('❌ Error checking provider conversations:', error);
    }
  };

  const handleDirectChat = async (provider: SimpleProvider) => {
    console.log('🔍 Direct chat with provider:', provider.id);
    
    if (!user) {
      alert('Please log in to start a chat.');
      return;
    }

    try {
      // ✅ NEW: Check for existing conversation first
      const { findExistingConversation, createConversation, updateConversationServices } = await import('@/lib/chat-services');
      
      const deviceInfo = {
        brand: device.brand,
        model: device.model,
        category: device.category as 'phone' | 'laptop'
      };
      
      const currentServices = services.map(service => service.name || service.id);
      
      console.log('🔍 Checking for existing conversation with:', { deviceInfo, currentServices });
      
      // Look for existing conversation
      const existingResult = await findExistingConversation(user.id, provider.id, deviceInfo);
      
      if (existingResult.success && existingResult.conversation) {
        console.log('✅ Found existing conversation:', existingResult.conversation.id);
        
        // Check if services have changed
        const existingServices = existingResult.conversation.services;
        const servicesChanged = JSON.stringify(existingServices.sort()) !== JSON.stringify(currentServices.sort());
        
        if (servicesChanged) {
          console.log('🔄 Services changed, updating existing conversation');
          console.log('Old services:', existingServices);
          console.log('New services:', currentServices);
          
          // Update the existing conversation with new services
          const updateResult = await updateConversationServices(
            existingResult.conversation.id,
            currentServices
          );
          
          if (updateResult.success) {
            console.log('✅ Updated existing conversation with new services');
          } else {
            console.warn('⚠️ Failed to update conversation services:', updateResult.error);
          }
        }
        
        // Redirect to existing chat
        if (typeof window !== 'undefined') {
          window.location.href = '/chat';
        }
        return;
      }
      
      // No existing conversation found, create new one
      console.log('🔍 No existing conversation found, creating new one');
      
      const conversationResult = await createConversation(
        user.id,
        provider.id,
        deviceInfo,
        currentServices
      );

      if (!conversationResult.success) {
        throw new Error(conversationResult.error || 'Failed to create conversation');
      }
      
      const conversationId = conversationResult.conversationId!;
      console.log('✅ Created new conversation:', conversationId);

      // Navigate to chat page in same tab
      if (typeof window !== 'undefined') {
        window.location.href = '/chat';
      }
      
    } catch (error) {
      console.error('❌ Error starting direct chat:', error);
      alert('Failed to start chat. Please try again.');
    }
  };

  const handleContinue = () => {
    if (selectedProvider) {
      onProviderSelect(selectedProvider, partQuality);
    }
  };

  const hasScreenReplacement = services.some(s => s.name.toLowerCase().includes('screen replacement'));

  const sortedProviders = [...providers].sort((a, b) => {
    if (sortBy === 'distance') {
      return a.distance - b.distance;
    } else if (sortBy === 'experience') {
      return b.yearsOfExperience - a.yearsOfExperience;
    }
    return 0;
  });

  const filteredProviders = sortedProviders.filter(provider => {
    if (verifiedOnly && !provider.isVerified) return false;
    return true;
  });

  // Don't return early for loading - show header and filters while providers load

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  // No providers message is now handled in the provider list section

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Select a Provider</h1>
            <p className="text-lg text-gray-600">
              Found {filteredProviders.length} provider{filteredProviders.length !== 1 ? 's' : ''} for your {device.brand} {device.model}
            </p>
          </div>
          <Button variant="outline" onClick={onBack} className="h-11 px-6">
            ← Back
          </Button>
        </div>

        {/* Filters & Sorting */}
        <Card className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-gray-500" />
                <span className="font-medium text-gray-700">Filters & Sorting</span>
              </div>
              
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={verifiedOnly}
                    onChange={(e) => setVerifiedOnly(e.target.checked)}
                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <span className="text-sm text-gray-700">Verified only</span>
                </label>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">Sort by:</span>
              <Select value={sortBy} onValueChange={(value: 'distance' | 'experience') => setSortBy(value)}>
                <SelectTrigger className="w-40 h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="distance">Distance</SelectItem>
                  <SelectItem value="experience">Experience</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>
      </div>

      {/* Provider List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-6"></div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Finding providers...</h3>
            <p className="text-gray-600">Searching for the best service providers with tier pricing</p>
          </div>
        </div>
      ) : filteredProviders.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          {filteredProviders.map((provider) => (
            <ProviderCard
              key={provider.id}
              provider={provider}
              servicesOffered={provider.matchingServices}
              selectedIssues={selectedIssues}
              selectedModel={`${device.brand} ${device.model}`}
              onViewProfile={() => handleSelectProvider(provider)}
              onGetQuote={() => handleGetQuote(provider)}
              onDirectChat={() => handleDirectChat(provider)}
              hasActiveNegotiation={false} // TODO: Check for active negotiations
              hasActiveConversation={providerConversations[provider.id] || false} // ✅ NEW: Pass conversation status
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="max-w-md mx-auto">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">No providers found</h3>
            <p className="text-gray-600 mb-6">
              We couldn't find any providers for your selected device and services. Try selecting different services or check back later for more providers.
            </p>
            <Button onClick={onBack} variant="outline" className="h-11 px-8">
              ← Go Back
            </Button>
          </div>
        </div>
      )}

      {/* Continue Button */}
      {selectedProvider && (
        <div className="fixed bottom-6 right-6">
          <Button onClick={handleContinue} size="lg" className="shadow-lg">
            Continue with {selectedProvider.businessName || selectedProvider.name}
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}

      {/* Custom Quote Request Modal */}
      {selectedProviderForQuote && (
        <CustomQuoteRequestModal
          isOpen={isQuoteModalOpen}
          onClose={() => {
            setIsQuoteModalOpen(false);
            setSelectedProviderForQuote(null);
          }}
          provider={selectedProviderForQuote}
          device={device}
          selectedIssues={selectedIssues}
          initialTierPrices={selectedProviderForQuote.matchingServices.map((service: any) => ({
            issue: service.issue,
            price: service.price,
            partType: service.partType
          }))}
          onSubmit={async (requestData) => {
            console.log('🔍 Submitting quote request:', requestData);
            
            if (!user) {
              alert('Please log in to submit a quote request.');
              return;
            }

            try {
              // Call the API endpoint instead of the service directly
              const response = await fetch('/api/quote-requests', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  ...requestData,
                  customer_id: user.id,
                  provider_id: selectedProviderForQuote.id,
                  device_info: {
                    brand: device.brand,
                    model: device.model,
                    category: device.category
                  },
                  service_issues: selectedIssues.map(s => s.id),
                  initial_tier_prices: selectedProviderForQuote.matchingServices.map((service: any) => ({
                    issue: service.issue,
                    price: service.price,
                    partType: service.partType
                  }))
                }),
              });

              const result = await response.json();
              
              if (result.success) {
                console.log('✅ Quote request created:', result.requestId);
                alert('Quote request submitted successfully! Provider will contact you soon.');
                
                // Close modal
                setIsQuoteModalOpen(false);
                setSelectedProviderForQuote(null);
              } else {
                console.error('❌ Error creating quote request:', result.error);
                alert(`Error submitting request: ${result.error}`);
              }
            } catch (error) {
              console.error('❌ Unexpected error:', error);
              alert('An unexpected error occurred. Please try again.');
            }
          }}
        />
      )}
    </div>
  );
} 