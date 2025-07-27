"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, MapPin, Clock } from 'lucide-react';

interface ProviderCardProps {
  provider: {
    id: string;
    name: string;
    isVerified: boolean;
    joinedAt?: string;
    rating?: number;
    yearsOfExperience?: number;
    location?: string;
    availability?: string;
    businessName?: string;
    profilePicture?: string;
  };
  servicesOffered: Array<{
    issue: string;
    partType?: 'OEM' | 'High Quality';
    price: number;
    warranty?: string;
  }>;
  selectedIssues: { id: string; name?: string; partType?: string }[];
  selectedModel: string;
  onViewProfile?: () => void;
  onBookNow?: () => void;
}

export const ProviderCard: React.FC<ProviderCardProps> = ({
  provider, 
  servicesOffered,
  selectedIssues,
  selectedModel,
  onViewProfile,
  onBookNow
}) => {
  // Normalize part type for matching
  const normalizePartType = (pt?: string) => {
    if (!pt) return '';
    if (pt.toLowerCase().startsWith('hq') || pt.toLowerCase().includes('high quality')) return 'HQ';
    if (pt.toLowerCase().startsWith('oem')) return 'OEM';
    return pt;
  };

  // Calculate total estimate only from matched services
  let totalEstimate = 0;
  const matchedServices: any[] = [];

  // For debugging: log selected issues, model, and servicesOffered
  console.warn('[DEBUG] ProviderCard selectedIssues:', selectedIssues, 'selectedModel:', selectedModel, 'servicesOffered:', servicesOffered);

  // Build UI for each selected issue
  const issueRows = selectedIssues.map((issueObj) => {
    // Try to match by issue id and partType (if present)
    const match = servicesOffered.find(s =>
      s.issue === issueObj.id &&
      (!s.partType || normalizePartType(s.partType) === normalizePartType(issueObj.partType))
    );
    console.warn('[DEBUG] ProviderCard matching:', { issueObj, selectedModel, match });
    const displayName = issueObj.name || issueObj.id;
    if (match) {
      matchedServices.push(match);
      totalEstimate += match.price || 0;
      if (issueObj.partType) {
        return (
          <div key={issueObj.id + '-' + issueObj.partType} className="flex flex-col text-sm">
            <span>
              {displayName} ({issueObj.partType}): <span className="font-semibold">₹{match.price.toLocaleString()}</span> {match.warranty && <span className="ml-2">| {match.warranty} warranty</span>}
            </span>
          </div>
        );
      }
      return (
        <div key={issueObj.id} className="flex flex-col text-sm">
          <span>
            {displayName}: <span className="font-semibold">₹{match.price.toLocaleString()}</span>
          </span>
        </div>
      );
    } else {
      return (
        <div key={issueObj.id + (issueObj.partType ? '-' + issueObj.partType : '')} className="text-sm text-muted-foreground">{displayName}{issueObj.partType ? ` (${issueObj.partType})` : ''}: Not offered</div>
      );
    }
  });

  return (
    <Card className="rounded-lg shadow-md p-0">
      <CardHeader className="flex flex-row items-center gap-4 pb-2">
        <img
          src={provider.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(provider.name)}`}
          alt={provider.name}
          className="w-14 h-14 rounded-full object-cover border"
        />
        <div className="flex-1">
              <div className="flex items-center gap-2">
            <CardTitle className="text-lg font-semibold">
              {provider.businessName || provider.name}
            </CardTitle>
            {provider.isVerified && <Badge variant="secondary">Verified</Badge>}
              </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <Star className="h-4 w-4 text-yellow-400" />
            <span>{provider.rating ? provider.rating.toFixed(1) : 'N/A'}</span>
            <span>· {provider.yearsOfExperience ? `${provider.yearsOfExperience}+ Years` : 'Experience N/A'}</span>
              </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <MapPin className="h-4 w-4" />
            <span>{provider.location || 'Location N/A'}</span>
          </div>
          {provider.availability && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <Clock className="h-4 w-4" />
              <span>{provider.availability}</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0 pb-4">
        <div className="mb-2 font-medium">Selected Issues for {selectedModel}:</div>
        <div className="space-y-2 mb-3">
          {issueRows}
        </div>
        <div className="flex items-center justify-between font-semibold text-base mb-4">
          <span>Total Estimate:</span>
          <span>₹{totalEstimate.toLocaleString()}</span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onViewProfile}>View Profile</Button>
          <Button className="flex-1" onClick={onBookNow}>Book Now</Button>
        </div>
      </CardContent>
    </Card>
  );
}; 