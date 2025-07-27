"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Star, 
  MapPin, 
  Clock, 
  Award, 
  DollarSign,
  CheckCircle,
  X
} from 'lucide-react';
import { Technician } from '@/types/technician';

interface TechnicianComparisonProps {
  technicians: Technician[];
  onBack: () => void;
  onSelect: (technician: Technician) => void;
}

export function TechnicianComparison({ technicians, onBack, onSelect }: TechnicianComparisonProps) {
  const comparisonFields = [
    { key: 'overall_rating', label: 'Rating', icon: Star, format: (val: number) => `${val.toFixed(1)} stars` },
    { key: 'completed_orders', label: 'Jobs Completed', icon: Award, format: (val: number) => val.toString() },
    { key: 'experience_years', label: 'Experience', icon: Clock, format: (val: number) => `${val}+ years` },
    { key: 'response_time_avg', label: 'Response Time', icon: Clock, format: (val: number) => `${val} min` },
    { key: 'distance_from_customer', label: 'Distance', icon: MapPin, format: (val: number) => `${val.toFixed(1)} mi` },
    { key: 'base_rate', label: 'Base Rate', icon: DollarSign, format: (val: number) => `$${val}/hr` },
    { key: 'travel_fee', label: 'Travel Fee', icon: DollarSign, format: (val: number) => `$${val}` }
  ];

  const getValue = (technician: Technician, key: string) => {
    switch (key) {
      case 'base_rate':
        return technician.pricing.base_rate;
      case 'travel_fee':
        return technician.pricing.travel_fee;
      default:
        return (technician as any)[key];
    }
  };

  const getBestValue = (key: string) => {
    const values = technicians.map(tech => getValue(tech, key));
    switch (key) {
      case 'overall_rating':
      case 'completed_orders':
      case 'experience_years':
        return Math.max(...values);
      case 'response_time_avg':
      case 'distance_from_customer':
      case 'base_rate':
      case 'travel_fee':
        return Math.min(...values);
      default:
        return null;
    }
  };

  const isBestValue = (technician: Technician, key: string) => {
    const value = getValue(technician, key);
    const bestValue = getBestValue(key);
    return value === bestValue;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Compare Technicians</h2>
          <p className="text-muted-foreground">
            Comparing {technicians.length} technicians side by side
          </p>
        </div>
        <Button variant="ghost" onClick={onBack}>
          ← Back
        </Button>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {technicians.map((technician) => (
              <Card key={technician.id} className="relative">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={technician.profile_photo} alt={technician.first_name} />
                        <AvatarFallback>
                          {technician.first_name.charAt(0)}{technician.last_name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">
                          {technician.first_name} {technician.last_name}
                        </h3>
                        <p className="text-sm text-muted-foreground">{technician.business_name}</p>
                      </div>
                    </div>
                    <Badge variant={technician.availability_status === 'available' ? 'default' : 'secondary'}>
                      {technician.availability_status}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Comparison Fields */}
                  <div className="space-y-3">
                    {comparisonFields.map((field) => {
                      const value = getValue(technician, field.key);
                      const isBest = isBestValue(technician, field.key);
                      const Icon = field.icon;

                      return (
                        <div key={field.key} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{field.label}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span className={`text-sm font-medium ${isBest ? 'text-green-600' : ''}`}>
                              {field.format(value)}
                            </span>
                            {isBest && <CheckCircle className="h-4 w-4 text-green-600" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Specializations */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">Specializations</h4>
                    <div className="flex flex-wrap gap-1">
                      {technician.specializations.slice(0, 3).map((spec) => (
                        <Badge key={spec} variant="outline" className="text-xs">
                          {spec}
                        </Badge>
                      ))}
                      {technician.specializations.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{technician.specializations.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Certifications */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">Certifications</h4>
                    <div className="flex flex-wrap gap-1">
                      {technician.certifications.slice(0, 2).map((cert) => (
                        <Badge key={cert} className="text-xs bg-blue-100 text-blue-800">
                          {cert}
                        </Badge>
                      ))}
                      {technician.certifications.length > 2 && (
                        <Badge className="text-xs bg-blue-100 text-blue-800">
                          +{technician.certifications.length - 2}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Badges */}
                  {technician.badges.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Badges</h4>
                      <div className="flex flex-wrap gap-1">
                        {technician.badges.slice(0, 2).map((badge) => (
                          <Badge key={badge} className="text-xs bg-gold-100 text-gold-800">
                            {badge}
                          </Badge>
                        ))}
                      </div>
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

                  {/* Action Button */}
                  <Button 
                    onClick={() => onSelect(technician)} 
                    className="w-full"
                  >
                    Select {technician.first_name}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Comparison Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-green-600 mb-2">Highest Rated</h4>
              {(() => {
                const highest = technicians.reduce((prev, current) => 
                  prev.overall_rating > current.overall_rating ? prev : current
                );
                return (
                  <p>{highest.first_name} {highest.last_name} - {highest.overall_rating.toFixed(1)} stars</p>
                );
              })()}
            </div>
            <div>
              <h4 className="font-medium text-blue-600 mb-2">Most Experienced</h4>
              {(() => {
                const mostExp = technicians.reduce((prev, current) => 
                  prev.experience_years > current.experience_years ? prev : current
                );
                return (
                  <p>{mostExp.first_name} {mostExp.last_name} - {mostExp.experience_years}+ years</p>
                );
              })()}
            </div>
            <div>
              <h4 className="font-medium text-purple-600 mb-2">Best Value</h4>
              {(() => {
                const bestValue = technicians.reduce((prev, current) => 
                  prev.pricing.base_rate < current.pricing.base_rate ? prev : current
                );
                return (
                  <p>{bestValue.first_name} {bestValue.last_name} - ${bestValue.pricing.base_rate}/hr</p>
                );
              })()}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}