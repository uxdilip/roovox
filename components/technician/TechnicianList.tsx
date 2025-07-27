"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { TechnicianCard } from './TechnicianCard';
import { TechnicianFiltersComponent } from './TechnicianFilters';
import { TechnicianProfile } from './TechnicianProfile';
import { TechnicianComparison } from './TechnicianComparison';
import { BookingConfirmation } from './BookingConfirmation';
import { 
  Users, 
  SlidersHorizontal, 
  ArrowUpDown,
  MapPin,
  Star,
  DollarSign,
  Clock
} from 'lucide-react';
import { Technician, TechnicianFilters, PartInspectionRequest } from '@/types/technician';

interface TechnicianListProps {
  inspectionRequest: PartInspectionRequest;
  onBack: () => void;
}

// Dummy technician data for testing
const dummyTechnicians: Technician[] = [
  {
    id: 'tech_1',
    user_id: 'user_1',
    profile_photo: '/api/placeholder/60/60',
    business_name: 'TechFix Pro',
    first_name: 'Rajesh',
    last_name: 'Kumar',
    specializations: ['iPhone Repair', 'Samsung Repair', 'Screen Replacement', 'Battery Replacement'],
    certifications: ['Apple Certified', 'Samsung Certified'],
    overall_rating: 4.8,
    total_reviews: 127,
    completed_orders: 89,
    response_time_avg: 15,
    experience_years: 5,
    service_radius: 10,
    current_location: { lat: 30.7046, lng: 76.7179 },
    availability_status: 'available',
    working_hours: [
      { day: 'mon', start: '09:00', end: '18:00', available: true },
      { day: 'tue', start: '09:00', end: '18:00', available: true },
      { day: 'wed', start: '09:00', end: '18:00', available: true },
      { day: 'thu', start: '09:00', end: '18:00', available: true },
      { day: 'fri', start: '09:00', end: '18:00', available: true },
      { day: 'sat', start: '10:00', end: '16:00', available: true },
      { day: 'sun', start: '10:00', end: '14:00', available: false }
    ],
    pricing: {
      base_rate: 1200,
      emergency_rate: 1800,
      travel_fee: 200
    },
    verification_status: 'verified',
    badges: ['Top Rated', 'Fast Service', 'Expert Technician'],
    reviews_summary: {
      recent_reviews: [
        {
          id: 'rev_1',
          customer_name: 'Amit Singh',
          rating: 5,
          comment: 'Excellent service! Fixed my iPhone screen quickly.',
          service_type: 'Screen Replacement',
          created_at: '2024-01-15T10:00:00Z'
        }
      ],
      rating_breakdown: { 5: 100, 4: 20, 3: 5, 2: 1, 1: 1 }
    },
    distance_from_customer: 2.3,
    estimated_arrival: 15
  },
  {
    id: 'tech_2',
    user_id: 'user_2',
    profile_photo: '/api/placeholder/60/60',
    business_name: 'Mobile Care Solutions',
    first_name: 'Priya',
    last_name: 'Sharma',
    specializations: ['Laptop Repair', 'MacBook Repair', 'Hardware Upgrade', 'Software Issues'],
    certifications: ['Dell Certified', 'HP Certified'],
    overall_rating: 4.6,
    total_reviews: 89,
    completed_orders: 67,
    response_time_avg: 20,
    experience_years: 3,
    service_radius: 8,
    current_location: { lat: 30.7046, lng: 76.7179 },
    availability_status: 'available',
    working_hours: [
      { day: 'mon', start: '10:00', end: '19:00', available: true },
      { day: 'tue', start: '10:00', end: '19:00', available: true },
      { day: 'wed', start: '10:00', end: '19:00', available: true },
      { day: 'thu', start: '10:00', end: '19:00', available: true },
      { day: 'fri', start: '10:00', end: '19:00', available: true },
      { day: 'sat', start: '11:00', end: '17:00', available: true },
      { day: 'sun', start: '11:00', end: '15:00', available: false }
    ],
    pricing: {
      base_rate: 1500,
      emergency_rate: 2200,
      travel_fee: 150
    },
    verification_status: 'verified',
    badges: ['Expert Technician', 'Reliable Service'],
    reviews_summary: {
      recent_reviews: [
        {
          id: 'rev_2',
          customer_name: 'Rahul Verma',
          rating: 4,
          comment: 'Good laptop repair service. Professional approach.',
          service_type: 'Laptop Repair',
          created_at: '2024-01-14T14:00:00Z'
        }
      ],
      rating_breakdown: { 5: 60, 4: 25, 3: 3, 2: 1, 1: 0 }
    },
    distance_from_customer: 3.1,
    estimated_arrival: 25
  },
  {
    id: 'tech_3',
    user_id: 'user_3',
    profile_photo: '/api/placeholder/60/60',
    business_name: 'QuickFix Mobile',
    first_name: 'Amit',
    last_name: 'Patel',
    specializations: ['All Brands', 'Emergency Repair', 'Water Damage', 'Data Recovery'],
    certifications: ['Multi-Brand Certified', 'Data Recovery Expert'],
    overall_rating: 4.9,
    total_reviews: 203,
    completed_orders: 156,
    response_time_avg: 10,
    experience_years: 7,
    service_radius: 15,
    current_location: { lat: 30.7046, lng: 76.7179 },
    availability_status: 'busy',
    working_hours: [
      { day: 'mon', start: '08:00', end: '20:00', available: true },
      { day: 'tue', start: '08:00', end: '20:00', available: true },
      { day: 'wed', start: '08:00', end: '20:00', available: true },
      { day: 'thu', start: '08:00', end: '20:00', available: true },
      { day: 'fri', start: '08:00', end: '20:00', available: true },
      { day: 'sat', start: '09:00', end: '18:00', available: true },
      { day: 'sun', start: '09:00', end: '16:00', available: true }
    ],
    pricing: {
      base_rate: 1800,
      emergency_rate: 2500,
      travel_fee: 300
    },
    verification_status: 'verified',
    badges: ['Premium Service', '24/7 Support', 'Emergency Expert'],
    reviews_summary: {
      recent_reviews: [
        {
          id: 'rev_3',
          customer_name: 'Sneha Gupta',
          rating: 5,
          comment: 'Amazing emergency service! Fixed my phone at midnight.',
          service_type: 'Emergency Repair',
          created_at: '2024-01-13T23:00:00Z'
        }
      ],
      rating_breakdown: { 5: 180, 4: 20, 3: 2, 2: 1, 1: 0 }
    },
    distance_from_customer: 1.8,
    estimated_arrival: 10
  }
];

export function TechnicianList({ inspectionRequest, onBack }: TechnicianListProps) {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [filteredTechnicians, setFilteredTechnicians] = useState<Technician[]>([]);
  const [selectedTechnician, setSelectedTechnician] = useState<Technician | null>(null);
  const [viewingProfile, setViewingProfile] = useState<Technician | null>(null);
  const [comparingTechnicians, setComparingTechnicians] = useState<Technician[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'distance' | 'rating' | 'price' | 'response_time'>('distance');
  const [loading, setLoading] = useState(true);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);

  const [filters, setFilters] = useState<TechnicianFilters>({
    distance_radius: 25,
    min_rating: 3.0,
    max_price: 150,
    experience_level: 'any',
    availability: 'any',
    specializations: [],
    certifications: []
  });

  // Load dummy technician data
  useEffect(() => {
    // Simulate API call delay
    setTimeout(() => {
      setTechnicians(dummyTechnicians);
      setLoading(false);
    }, 1000);
  }, []);

  // Apply filters and sorting
  useEffect(() => {
    let filtered = technicians.filter(tech => {
      if (tech.distance_from_customer && tech.distance_from_customer > filters.distance_radius) return false;
      if (tech.overall_rating < filters.min_rating) return false;
      if (tech.pricing.base_rate > filters.max_price) return false;
      
      if (filters.experience_level !== 'any') {
        const expLevel = tech.experience_years >= 5 ? 'expert' : 
                        tech.experience_years >= 3 ? 'intermediate' : 'beginner';
        if (expLevel !== filters.experience_level) return false;
      }

      if (filters.availability !== 'any') {
        if (filters.availability === 'immediate' && tech.availability_status !== 'available') return false;
      }

      if (filters.specializations.length > 0) {
        const hasSpecialization = filters.specializations.some(spec => 
          tech.specializations.includes(spec)
        );
        if (!hasSpecialization) return false;
      }

      if (filters.certifications.length > 0) {
        const hasCertification = filters.certifications.some(cert => 
          tech.certifications.includes(cert)
        );
        if (!hasCertification) return false;
      }

      return true;
    });

    // Sort technicians
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'distance':
          return (a.distance_from_customer || 0) - (b.distance_from_customer || 0);
        case 'rating':
          return b.overall_rating - a.overall_rating;
        case 'price':
          return a.pricing.base_rate - b.pricing.base_rate;
        case 'response_time':
          return a.response_time_avg - b.response_time_avg;
        default:
          return 0;
      }
    });

    setFilteredTechnicians(filtered);
  }, [technicians, filters, sortBy]);

  const handleSelectTechnician = (technician: Technician) => {
    setSelectedTechnician(technician);
  };

  const handleViewProfile = (technician: Technician) => {
    setViewingProfile(technician);
  };

  const handleCompare = (technician: Technician) => {
    if (comparingTechnicians.find(t => t.id === technician.id)) {
      setComparingTechnicians(comparingTechnicians.filter(t => t.id !== technician.id));
    } else if (comparingTechnicians.length < 3) {
      setComparingTechnicians([...comparingTechnicians, technician]);
    }
  };

  const handleBookingConfirm = () => {
    setBookingConfirmed(true);
  };

  const clearFilters = () => {
    setFilters({
      distance_radius: 25,
      min_rating: 3.0,
      max_price: 150,
      experience_level: 'any',
      availability: 'any',
      specializations: [],
      certifications: []
    });
  };

  if (bookingConfirmed && selectedTechnician) {
    return (
      <BookingConfirmation
        technician={selectedTechnician}
        inspectionRequest={inspectionRequest}
        onBack={() => setBookingConfirmed(false)}
      />
    );
  }

  if (viewingProfile) {
    return (
      <TechnicianProfile
        technician={viewingProfile}
        onBack={() => setViewingProfile(null)}
        onSelect={() => {
          setSelectedTechnician(viewingProfile);
          setViewingProfile(null);
        }}
      />
    );
  }

  if (comparingTechnicians.length > 0) {
    return (
      <TechnicianComparison
        technicians={comparingTechnicians}
        onBack={() => setComparingTechnicians([])}
        onSelect={(technician) => {
          setSelectedTechnician(technician);
          setComparingTechnicians([]);
        }}
      />
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Available Technicians</h2>
            <p className="text-muted-foreground">
              {inspectionRequest.part_details.part_type} inspection for {inspectionRequest.device_info.brand} {inspectionRequest.device_info.model}
            </p>
          </div>
          <Button variant="ghost" onClick={onBack}>
            ← Back
          </Button>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading technicians...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Available Technicians</h2>
          <p className="text-muted-foreground">
            {inspectionRequest.part_details.part_type} inspection for {inspectionRequest.device_info.brand} {inspectionRequest.device_info.model}
          </p>
        </div>
        <Button variant="ghost" onClick={onBack}>
          ← Back
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <div className={`lg:col-span-1 ${showFilters ? 'block' : 'hidden lg:block'}`}>
          <TechnicianFiltersComponent
            filters={filters}
            onFiltersChange={setFilters}
            onClearFilters={clearFilters}
          />
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Controls */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
                <div className="flex items-center space-x-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    className="lg:hidden"
                  >
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    Filters
                  </Button>
                  
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      {filteredTechnicians.length} technicians found
                    </span>
                  </div>

                  {comparingTechnicians.length > 0 && (
                    <Badge variant="secondary">
                      Comparing {comparingTechnicians.length}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <ArrowUpDown className="h-4 w-4" />
                  <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="distance">
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4" />
                          <span>Distance</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="rating">
                        <div className="flex items-center space-x-2">
                          <Star className="h-4 w-4" />
                          <span>Rating</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="price">
                        <div className="flex items-center space-x-2">
                          <DollarSign className="h-4 w-4" />
                          <span>Price</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="response_time">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4" />
                          <span>Response Time</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Technician Cards */}
          {filteredTechnicians.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="space-y-4">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto" />
                  <h3 className="text-lg font-semibold">No technicians found</h3>
                  <p className="text-muted-foreground">
                    Try adjusting your filters or expanding your search area
                </p>
                  <Button onClick={clearFilters} variant="outline">
                    Clear Filters
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredTechnicians.map((technician) => (
                <TechnicianCard
                  key={technician.id}
                  technician={technician}
                  onSelect={handleSelectTechnician}
                  onViewProfile={handleViewProfile}
                  onCompare={handleCompare}
                  isSelected={selectedTechnician?.id === technician.id}
                  isComparing={comparingTechnicians.some(t => t.id === technician.id)}
                />
              ))}
            </div>
          )}

          {/* Selected Technician Actions */}
          {selectedTechnician && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                  <div>
                      <h4 className="font-semibold">Selected: {selectedTechnician.first_name} {selectedTechnician.last_name}</h4>
                      <p className="text-sm text-muted-foreground">{selectedTechnician.business_name}</p>
                    </div>
                  </div>
                    <Button onClick={handleBookingConfirm}>
                    Continue to Booking
                    </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}