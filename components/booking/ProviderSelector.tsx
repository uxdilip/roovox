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
import { Query } from 'appwrite';
// Haversine formula (local implementation)
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

// Update the SimpleProvider interface
type SimpleProvider = {
  id: string;
  name: string;
  business_name: string;
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
  servicesOffered: any[]; // Added for ProviderCard integration
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
  const [providers, setProviders] = useState<any[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<SimpleProvider | null>(null);
  const [filterQuality, setFilterQuality] = useState<'all' | 'OEM' | 'HQ'>('all');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'distance' | 'experience'>('distance');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProviders = async () => {
      setLoading(true);
      setError(null);
      try {
        // Use issue IDs for the query
        const queryIssues = services.map((s: any) => s.id);
        const soRes = await databases.listDocuments(
          DATABASE_ID,
          'services_offered',
          [
            Query.equal('deviceType', device.category),
            Query.equal('brand', device.brand),
            Query.equal('model', device.model),
            Query.contains('issue', queryIssues)
          ]
        );
        const serviceDocs = soRes.documents;
        const providerIds = Array.from(new Set(serviceDocs.map((s: any) => s.providerId)));
        if (providerIds.length === 0) {
          setProviders([]);
          setLoading(false);
          return;
        }
        const providersRes = await databases.listDocuments(
          DATABASE_ID,
          'providers',
          [
            Query.contains('providerId', providerIds),
            Query.equal('isApproved', true),
            Query.equal('isVerified', true),
            Query.equal('onboardingCompleted', true)
          ]
        );
        const providerDocs = providersRes.documents;
        const validProviderIds = providerDocs.map((p: any) => p.providerId);
        if (validProviderIds.length === 0) {
          setProviders([]);
          setLoading(false);
          return;
        }
        const businessSetups = await Promise.all(validProviderIds.map(async (pid) => {
          const res = await databases.listDocuments(
            DATABASE_ID,
            'business_setup',
            [Query.equal('user_id', pid), Query.limit(1)]
          );
          return { providerId: pid, doc: res.documents[0] };
        }));
        // 4. Fetch users for each provider
        const usersRes = await databases.listDocuments(
          DATABASE_ID,
          'User',
          [Query.contains('user_id', validProviderIds)]
        );
        // 5. Fetch bookings for each provider
        const bookingsRes = await databases.listDocuments(
          DATABASE_ID,
          'bookings',
          [Query.contains('provider_id', validProviderIds)]
        );
        // 6. Aggregate data for provider cards
        const today = new Date().toLocaleString('en-US', { weekday: 'long' });
        const providerCards = validProviderIds.map((pid) => {
          const prov = providerDocs.find((p: any) => p.providerId === pid);
          if (!prov) return null;
          const user = usersRes.documents.find((u: any) => u.user_id === pid) || {};
          const business = businessSetups.find(b => b.providerId === pid)?.doc;
          let onboarding = {};
          try { onboarding = business ? JSON.parse(business.onboarding_data || '{}') : {}; } catch { onboarding = {}; }
          const serviceSetup = (onboarding as any)?.serviceSetup || {};
          const businessInfo = (onboarding as any)?.businessInfo || {};
          const location = serviceSetup?.location?.coordinates || [0, 0];
          // Distance calculation
          let distance = 0;
          if (customerLocation && location && location.length === 2) {
            distance = haversineDistance(
              [customerLocation[0], customerLocation[1]],
              [location[0], location[1]]
            );
          }
          if (distance > 10) {
            return null;
          }
          // Experience
          const yearsOfExperience = (businessInfo as any)?.yearsOfExperience || 0;
          // Today's availability
          let todayAvailability = null;
          if (serviceSetup?.availability && Array.isArray(serviceSetup.availability)) {
            const today = new Date().toLocaleString('en-US', { weekday: 'long' });
            const todayAvail = serviceSetup.availability.find((a: any) => a.day === today);
            if (todayAvail && todayAvail.available) {
              todayAvailability = `${todayAvail.start} – ${todayAvail.end}`;
            }
          }
          // Bookings
          const providerBookings = bookingsRes.documents.filter((b: any) => b.provider_id === pid);
          const totalBookings = providerBookings.length;
          const ratings = providerBookings.map((b: any) => b.rating).filter((r: any) => typeof r === 'number' && r > 0);
          const avgRating = ratings.length > 0 ? (ratings.reduce((sum: number, r: number) => sum + r, 0) / ratings.length) : null;
          // Matching services
          const matchingServices = serviceDocs.filter((s: any) => s.providerId === pid && services.some((iss: any) => iss.id === s.issue));
          
          if (matchingServices.length === 0) {
            return null;
          }
          return {
            id: pid,
            name: (user as any)?.name || '-',
            phone: (user as any)?.phone || '-',
            isVerified: prov.isVerified,
            isApproved: prov.isApproved,
            totalBookings,
            avgRating,
            yearsOfExperience,
            todayAvailability,
            distance,
            matchingServices,
            businessName: (businessInfo as any)?.businessName || '',
            location: (serviceSetup?.serviceMode === 'instore' && (serviceSetup as any)?.location?.address)
              ? (serviceSetup as any)?.location?.address
              : (serviceSetup as any)?.location?.city || 'N/A',
            profilePicture: (user as any)?.profilePicture || '',
            // Add these for booking form
            serviceMode: serviceSetup?.serviceMode || 'both',
            storeAddress: serviceSetup?.location || null,
          };
        }).filter((p): p is any => !!p);
        setProviders(providerCards);
      } catch (err) {
        setError('Failed to load providers. Please check your filters and try again.');
        setProviders([]);
        setLoading(false);
      }
      setLoading(false);
    };
    fetchProviders();
  }, [device, services, customerLocation]);

  const handleSelectProvider = (provider: SimpleProvider) => {
    setSelectedProvider(provider);
  };

  const hasScreenReplacement = services.some(s => s.name.toLowerCase().includes('screen replacement'));

  const handleContinue = () => {
    if (selectedProvider) {
      onProviderSelect(selectedProvider, partQuality);
    }
  };

  const sortedProviders = [...providers].sort((a, b) => {
    if (sortBy === 'distance') {
      return a.distance - b.distance;
    } else if (sortBy === 'experience') {
      return b.yearsOfExperience - a.yearsOfExperience;
    }
        return 0;
  });

  if (loading) {
  return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Select Provider</h2>
            <p className="text-muted-foreground">
              {device.brand} {device.model} - {services.map(s => s.name).join(', ')}
            </p>
          </div>
          <Button variant="ghost" onClick={onBack}>
            ← Back
          </Button>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading providers...</p>
            </div>
              </div>
            </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Select Provider</h2>
          <p className="text-muted-foreground">
            {device.brand} {device.model} - {services.map(s => s.name).join(', ')}
          </p>
              </div>
        <Button variant="ghost" onClick={onBack}>
          ← Back
        </Button>
            </div>

      {/* Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {sortedProviders.length} providers found
                </span>
              </div>

              {selectedProvider && (
                <Badge variant="secondary">
                  Selected: {selectedProvider.name}
                </Badge>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <ArrowUpDown className="h-4 w-4" />
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="distance">
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4" />
                      <span>Distance</span>
            </div>
                  </SelectItem>
                  <SelectItem value="experience">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4" />
                      <span>Experience</span>
            </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              {/* Part Quality Filter */}
              <Select value={filterQuality} onValueChange={(value: any) => setFilterQuality(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Part Quality" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Qualities</SelectItem>
                  <SelectItem value="OEM">OEM</SelectItem>
                  <SelectItem value="HQ">High Quality</SelectItem>
                </SelectContent>
              </Select>
              {/* Verified Only Toggle */}
              <Button
                variant={verifiedOnly ? "default" : "outline"}
                className="ml-2"
                onClick={() => setVerifiedOnly(v => !v)}
                aria-pressed={verifiedOnly}
              >
                <span className="flex items-center gap-1">
                  <Badge variant="secondary">Verified Only</Badge>
                </span>
              </Button>
            </div>
              </div>
        </CardContent>
      </Card>

      {/* Provider Cards */}
      {sortedProviders.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="space-y-4">
              <Users className="h-12 w-12 text-muted-foreground mx-auto" />
              <h3 className="text-lg font-semibold">No providers found</h3>
              <p className="text-muted-foreground">
                Try adjusting your filters or expanding your search area
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedProviders.map((provider) => {
            // Gather matching services_offered for this provider
            const servicesOffered = provider.matchingServices || [];
            return (
              <ProviderCard
              key={provider.id}
                provider={provider}
                servicesOffered={servicesOffered}
                selectedIssues={selectedIssues}
                selectedModel={device.model}
                onViewProfile={() => {/* handle view profile */}}
                onBookNow={() => handleSelectProvider(provider)}
              />
            );
          })}
            </div>
      )}

      {/* Selected Provider Actions */}
      {selectedProvider && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
                      <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold">Selected: {selectedProvider.name}</h4>
                  <p className="text-sm text-muted-foreground">{selectedProvider.business_name}</p>
        </div>
      </div>
              <Button onClick={handleContinue}>
                Continue to Booking <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 