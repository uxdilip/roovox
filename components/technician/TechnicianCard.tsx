"use client";

import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Star, 
  MapPin, 
  Clock, 
  Shield, 
  Award, 
  MessageCircle,
  Calendar,
  DollarSign
} from 'lucide-react';
import { Technician } from '@/types/technician';

interface TechnicianCardProps {
  technician: Technician;
  onSelect: (technician: Technician) => void;
  onViewProfile: (technician: Technician) => void;
  onCompare: (technician: Technician) => void;
  isSelected?: boolean;
  isComparing?: boolean;
}

export function TechnicianCard({ 
  technician, 
  onSelect, 
  onViewProfile, 
  onCompare,
  isSelected = false,
  isComparing = false 
}: TechnicianCardProps) {
  const getAvailabilityColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500';
      case 'busy': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getAvailabilityText = (status: string) => {
    switch (status) {
      case 'available': return 'Available Now';
      case 'busy': return 'Busy';
      case 'offline': return 'Offline';
      default: return 'Unknown';
    }
  };

  return (
    <Card className={`relative overflow-hidden transition-all hover:shadow-lg ${
      isSelected ? 'ring-2 ring-primary' : ''
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Avatar className="h-12 w-12">
                <AvatarImage src={technician.profile_photo} alt={technician.first_name} />
                <AvatarFallback>
                  {technician.first_name.charAt(0)}{technician.last_name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                getAvailabilityColor(technician.availability_status)
              }`} />
            </div>
            <div>
              <h3 className="font-semibold text-lg">
                {technician.first_name} {technician.last_name}
              </h3>
              <p className="text-sm text-muted-foreground">{technician.business_name}</p>
              <div className="flex items-center space-x-1 mt-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium">{technician.overall_rating.toFixed(1)}</span>
                <span className="text-sm text-muted-foreground">
                  ({technician.total_reviews} reviews)
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <Badge variant={technician.availability_status === 'available' ? 'default' : 'secondary'}>
              {getAvailabilityText(technician.availability_status)}
            </Badge>
            {technician.distance_from_customer && (
              <div className="flex items-center space-x-1 mt-2 text-sm text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span>{technician.distance_from_customer.toFixed(1)} mi away</span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Specializations */}
        <div>
          <div className="flex flex-wrap gap-1">
            {technician.specializations.slice(0, 3).map((spec) => (
              <Badge key={spec} variant="outline" className="text-xs">
                {spec}
              </Badge>
            ))}
            {technician.specializations.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{technician.specializations.length - 3} more
              </Badge>
            )}
          </div>
        </div>

        {/* Key Stats */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <Award className="h-4 w-4 text-blue-500" />
            <span>{technician.completed_orders} jobs</span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-green-500" />
            <span>{technician.response_time_avg}min response</span>
          </div>
          <div className="flex items-center space-x-2">
            <Shield className="h-4 w-4 text-purple-500" />
            <span>{technician.experience_years}+ years exp</span>
          </div>
          <div className="flex items-center space-x-2">
            <DollarSign className="h-4 w-4 text-orange-500" />
            <span>${technician.pricing.base_rate}/hr</span>
          </div>
        </div>

        {/* Certifications/Badges */}
        {technician.badges.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {technician.badges.slice(0, 2).map((badge) => (
              <Badge key={badge} className="text-xs bg-blue-100 text-blue-800">
                {badge}
              </Badge>
            ))}
          </div>
        )}

        {/* Estimated Arrival */}
        {technician.estimated_arrival && (
          <div className="bg-green-50 p-2 rounded-lg">
            <div className="flex items-center space-x-2 text-sm text-green-700">
              <Clock className="h-4 w-4" />
              <span>Can arrive in {technician.estimated_arrival} minutes</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-2 pt-2">
          <Button 
            onClick={() => onSelect(technician)} 
            className="flex-1"
            variant={isSelected ? "default" : "outline"}
          >
            {isSelected ? 'Selected' : 'Select'}
          </Button>
          <Button 
            onClick={() => onViewProfile(technician)} 
            variant="outline" 
            size="sm"
          >
            <MessageCircle className="h-4 w-4" />
          </Button>
          <Button 
            onClick={() => onCompare(technician)} 
            variant="outline" 
            size="sm"
            className={isComparing ? 'bg-blue-50' : ''}
          >
            <Calendar className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}