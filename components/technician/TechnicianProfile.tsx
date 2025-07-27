"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { 
  Star, 
  MapPin, 
  Clock, 
  Shield, 
  Award, 
  Calendar,
  Phone,
  Mail,
  CheckCircle,
  DollarSign
} from 'lucide-react';
import { Technician } from '@/types/technician';

interface TechnicianProfileProps {
  technician: Technician;
  onBack: () => void;
  onSelect: () => void;
}

export function TechnicianProfile({ technician, onBack, onSelect }: TechnicianProfileProps) {
  // Remove mockReviews
  // TODO: Fetch real reviews for this technician from Appwrite
  const availableSlots = [
    '2:00 PM Today',
    '4:30 PM Today',
    '9:00 AM Tomorrow',
    '11:30 AM Tomorrow',
    '2:00 PM Tomorrow'
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Technician Profile</h2>
        <Button variant="ghost" onClick={onBack}>
          ← Back
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Overview */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start space-x-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={technician.profile_photo} alt={technician.first_name} />
                  <AvatarFallback className="text-lg">
                    {technician.first_name.charAt(0)}{technician.last_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-2xl font-bold">
                      {technician.first_name} {technician.last_name}
                    </h3>
                    {technician.verification_status === 'verified' && (
                      <CheckCircle className="h-6 w-6 text-green-500" />
                    )}
                  </div>
                  <p className="text-lg text-muted-foreground mb-2">{technician.business_name}</p>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold">{technician.overall_rating.toFixed(1)}</span>
                      <span className="text-muted-foreground">({technician.total_reviews} reviews)</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Award className="h-5 w-5 text-blue-500" />
                      <span>{technician.completed_orders} jobs completed</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{technician.experience_years}+</div>
                  <div className="text-sm text-muted-foreground">Years Experience</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{technician.response_time_avg}min</div>
                  <div className="text-sm text-muted-foreground">Avg Response</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{technician.service_radius}mi</div>
                  <div className="text-sm text-muted-foreground">Service Radius</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">${technician.pricing.base_rate}</div>
                  <div className="text-sm text-muted-foreground">Per Hour</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Specializations & Certifications */}
          <Card>
            <CardHeader>
              <CardTitle>Expertise</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Specializations</h4>
                <div className="flex flex-wrap gap-2">
                  {technician.specializations.map((spec) => (
                    <Badge key={spec} variant="secondary">{spec}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Certifications</h4>
                <div className="flex flex-wrap gap-2">
                  {technician.certifications.map((cert) => (
                    <Badge key={cert} className="bg-blue-100 text-blue-800">{cert}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Badges</h4>
                <div className="flex flex-wrap gap-2">
                  {technician.badges.map((badge) => (
                    <Badge key={badge} className="bg-gold-100 text-gold-800">{badge}</Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reviews */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Rating Breakdown */}
              <div className="mb-6">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="text-4xl font-bold">{technician.overall_rating.toFixed(1)}</div>
                  <div className="flex-1">
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <div key={rating} className="flex items-center space-x-2 mb-1">
                        <span className="text-sm w-3">{rating}</span>
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <Progress 
                          value={(technician.reviews_summary.rating_breakdown[rating as keyof typeof technician.reviews_summary.rating_breakdown] / technician.total_reviews) * 100} 
                          className="flex-1 h-2" 
                        />
                        <span className="text-sm text-muted-foreground w-8">
                          {technician.reviews_summary.rating_breakdown[rating as keyof typeof technician.reviews_summary.rating_breakdown]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent Reviews */}
              <div className="space-y-4">
                <h4 className="font-semibold">Recent Reviews</h4>
                {/* TODO: Fetch real reviews for this technician from Appwrite */}
                {/* For now, we'll show a placeholder message */}
                <p className="text-muted-foreground">No recent reviews available for this technician.</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Booking Sidebar */}
        <div className="space-y-6">
          {/* Availability */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Availability</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${
                    technician.availability_status === 'available' ? 'bg-green-500' :
                    technician.availability_status === 'busy' ? 'bg-yellow-500' : 'bg-gray-500'
                  }`} />
                  <span className="font-medium">
                    {technician.availability_status === 'available' ? 'Available Now' :
                     technician.availability_status === 'busy' ? 'Currently Busy' : 'Offline'}
                  </span>
                </div>

                {technician.estimated_arrival && (
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="flex items-center space-x-2 text-green-700">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        Can arrive in {technician.estimated_arrival} minutes
                      </span>
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="font-medium mb-2">Next Available Slots</h4>
                  <div className="space-y-2">
                    {availableSlots.slice(0, 3).map((slot, index) => (
                      <div key={index} className="text-sm p-2 bg-gray-50 rounded">
                        {slot}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5" />
                <span>Pricing</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span>Base Rate</span>
                <span className="font-semibold">${technician.pricing.base_rate}/hr</span>
              </div>
              <div className="flex justify-between">
                <span>Emergency Rate</span>
                <span className="font-semibold">${technician.pricing.emergency_rate}/hr</span>
              </div>
              <div className="flex justify-between">
                <span>Travel Fee</span>
                <span className="font-semibold">${technician.pricing.travel_fee}</span>
              </div>
              {technician.distance_from_customer && (
                <div className="pt-2 border-t">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Distance</span>
                    <span>{technician.distance_from_customer.toFixed(1)} miles</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contact & Book */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <Button onClick={onSelect} className="w-full" size="lg">
                Select This Technician
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm">
                  <Phone className="h-4 w-4 mr-1" />
                  Call
                </Button>
                <Button variant="outline" size="sm">
                  <Mail className="h-4 w-4 mr-1" />
                  Message
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="h-5 w-5" />
                <span>Location</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                <p>Service radius: {technician.service_radius} miles</p>
                {technician.distance_from_customer && (
                  <p>Distance from you: {technician.distance_from_customer.toFixed(1)} miles</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}