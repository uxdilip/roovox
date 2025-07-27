"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Filter, X } from 'lucide-react';
import { TechnicianFilters } from '@/types/technician';

interface TechnicianFiltersProps {
  filters: TechnicianFilters;
  onFiltersChange: (filters: TechnicianFilters) => void;
  onClearFilters: () => void;
}

export function TechnicianFiltersComponent({ 
  filters, 
  onFiltersChange, 
  onClearFilters 
}: TechnicianFiltersProps) {
  const specializations = [
    'Phone Repair',
    'Laptop Repair',
    'Tablet Repair',
    'Screen Replacement',
    'Battery Replacement',
    'Water Damage',
    'Software Issues',
    'Hardware Repair'
  ];

  const certifications = [
    'Apple Certified',
    'Samsung Certified',
    'CompTIA A+',
    'Mobile Repair Certified',
    'Micro-soldering',
    'Data Recovery'
  ];

  const updateFilters = (updates: Partial<TechnicianFilters>) => {
    onFiltersChange({ ...filters, ...updates });
  };

  const toggleSpecialization = (spec: string) => {
    const updated = filters.specializations.includes(spec)
      ? filters.specializations.filter(s => s !== spec)
      : [...filters.specializations, spec];
    updateFilters({ specializations: updated });
  };

  const toggleCertification = (cert: string) => {
    const updated = filters.certifications.includes(cert)
      ? filters.certifications.filter(c => c !== cert)
      : [...filters.certifications, cert];
    updateFilters({ certifications: updated });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filters</span>
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClearFilters}>
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Distance */}
        <div>
          <Label className="text-sm font-medium">Distance (miles)</Label>
          <div className="mt-2">
            <Slider
              value={[filters.distance_radius]}
              onValueChange={(value) => updateFilters({ distance_radius: value[0] })}
              max={50}
              min={1}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>1 mi</span>
              <span>{filters.distance_radius} mi</span>
              <span>50 mi</span>
            </div>
          </div>
        </div>

        {/* Rating */}
        <div>
          <Label className="text-sm font-medium">Minimum Rating</Label>
          <div className="mt-2">
            <Slider
              value={[filters.min_rating]}
              onValueChange={(value) => updateFilters({ min_rating: value[0] })}
              max={5}
              min={1}
              step={0.1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>1.0</span>
              <span>{filters.min_rating.toFixed(1)} stars</span>
              <span>5.0</span>
            </div>
          </div>
        </div>

        {/* Price Range */}
        <div>
          <Label className="text-sm font-medium">Max Price ($/hour)</Label>
          <div className="mt-2">
            <Slider
              value={[filters.max_price]}
              onValueChange={(value) => updateFilters({ max_price: value[0] })}
              max={200}
              min={25}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>$25</span>
              <span>${filters.max_price}</span>
              <span>$200</span>
            </div>
          </div>
        </div>

        {/* Experience Level */}
        <div>
          <Label className="text-sm font-medium">Experience Level</Label>
          <Select 
            value={filters.experience_level} 
            onValueChange={(value: 'beginner' | 'intermediate' | 'expert' | 'any') => 
              updateFilters({ experience_level: value })
            }
          >
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any Experience</SelectItem>
              <SelectItem value="beginner">Beginner (0-2 years)</SelectItem>
              <SelectItem value="intermediate">Intermediate (3-5 years)</SelectItem>
              <SelectItem value="expert">Expert (5+ years)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Availability */}
        <div>
          <Label className="text-sm font-medium">Availability</Label>
          <Select 
            value={filters.availability} 
            onValueChange={(value: 'immediate' | 'today' | 'this_week' | 'any') => 
              updateFilters({ availability: value })
            }
          >
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any Time</SelectItem>
              <SelectItem value="immediate">Available Now</SelectItem>
              <SelectItem value="today">Available Today</SelectItem>
              <SelectItem value="this_week">This Week</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Specializations */}
        <div>
          <Label className="text-sm font-medium">Specializations</Label>
          <div className="mt-2 space-y-2">
            {specializations.map((spec) => (
              <div key={spec} className="flex items-center space-x-2">
                <Checkbox
                  id={spec}
                  checked={filters.specializations.includes(spec)}
                  onCheckedChange={() => toggleSpecialization(spec)}
                />
                <Label htmlFor={spec} className="text-sm">{spec}</Label>
              </div>
            ))}
          </div>
          {filters.specializations.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {filters.specializations.map((spec) => (
                <Badge key={spec} variant="secondary" className="text-xs">
                  {spec}
                  <X 
                    className="h-3 w-3 ml-1 cursor-pointer" 
                    onClick={() => toggleSpecialization(spec)}
                  />
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Certifications */}
        <div>
          <Label className="text-sm font-medium">Certifications</Label>
          <div className="mt-2 space-y-2">
            {certifications.map((cert) => (
              <div key={cert} className="flex items-center space-x-2">
                <Checkbox
                  id={cert}
                  checked={filters.certifications.includes(cert)}
                  onCheckedChange={() => toggleCertification(cert)}
                />
                <Label htmlFor={cert} className="text-sm">{cert}</Label>
              </div>
            ))}
          </div>
          {filters.certifications.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {filters.certifications.map((cert) => (
                <Badge key={cert} variant="secondary" className="text-xs">
                  {cert}
                  <X 
                    className="h-3 w-3 ml-1 cursor-pointer" 
                    onClick={() => toggleCertification(cert)}
                  />
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}