"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, MapPin, Clock, ChevronDown, FileText, MessageSquare } from 'lucide-react';
import { CONTACT_OPTIONS } from '@/lib/chat-services';

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
    partType?: 'OEM' | 'HQ';
    price: number;
    warranty?: string;
    pricingType?: 'platform_series' | 'custom_series' | 'model_override' | 'tier_pricing';
    seriesName?: string;
    tierPrices?: {
      basic: number;
      standard: number;
      premium: number;
    };
    deviceTier?: 'basic' | 'standard' | 'premium';
  }>;
  selectedIssues: { id: string; name?: string; partType?: string }[];
  selectedModel: string;
  onViewProfile?: () => void;
  onGetQuote?: () => void;
  onDirectChat?: () => void;
  hasActiveNegotiation?: boolean;
  hasActiveConversation?: boolean; // ✅ NEW: Indicates if there's an active chat
}

export const ProviderCard: React.FC<ProviderCardProps> = ({
  provider, 
  servicesOffered,
  selectedIssues,
  selectedModel,
  onViewProfile,
  onGetQuote,
  onDirectChat,
  hasActiveNegotiation = false,
  hasActiveConversation = false
}) => {
  const [showContactOptions, setShowContactOptions] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowContactOptions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Normalize part type for matching
  const normalizePartType = (pt?: string) => {
    if (!pt) return '';
    if (pt.toLowerCase().startsWith('hq') || pt.toLowerCase().includes('high quality')) return 'HQ';
    if (pt.toLowerCase().startsWith('oem')) return 'OEM';
    return pt;
  };

  // Calculate total estimate and find starting price
  let totalEstimate = 0;
  let startingPrice = Infinity;
  const matchedServices: any[] = [];

  // Debug logging
  console.log('🔍 ProviderCard for provider:', provider.id, 'with', servicesOffered.length, 'services offered');

  // Build UI for each selected issue
  const issueRows = selectedIssues.map((issueObj) => {
    // Try to match by issue name (not ID) with case-insensitive matching
    const match = servicesOffered.find(s => {
      const serviceIssue = s.issue?.toLowerCase().trim();
      const selectedIssue = (issueObj.name || issueObj.id)?.toLowerCase().trim();
      const matchesIssue = serviceIssue === selectedIssue;
      // For non-screen replacement issues, don't require part type matching
      // Only screen replacement issues have part types (OEM/HQ)
      const isScreenReplacement = selectedIssue.includes('screen replacement');
      const matchesPartType = isScreenReplacement 
        ? (!s.partType || normalizePartType(s.partType) === normalizePartType(issueObj.partType))
        : true; // For non-screen issues, always match part type
      
      console.log('🔍 ProviderCard matching:', {
        serviceIssue: s.issue,
        selectedIssue: issueObj.name || issueObj.id,
        servicePartType: s.partType,
        selectedPartType: issueObj.partType,
        normalizedServicePartType: normalizePartType(s.partType),
        normalizedSelectedPartType: normalizePartType(issueObj.partType),
        isScreenReplacement,
        matchesIssue,
        matchesPartType,
        result: matchesIssue && matchesPartType
      });
      
      return matchesIssue && matchesPartType;
    });
    const displayName = issueObj.name || issueObj.id;
    if (match) {
      matchedServices.push(match);
      totalEstimate += match.price || 0;
      startingPrice = Math.min(startingPrice, match.price || 0);
      
      // Display tier pricing or regular pricing
      if (match.pricingType === 'tier_pricing') {
        return (
          <div key={issueObj.id} className="flex items-center justify-between text-sm">
            <span className="text-gray-700">{displayName}</span>
            <span className="font-semibold text-primary">₹{match.price.toLocaleString()}</span>
          </div>
        );
      }

      if (issueObj.partType) {
        return (
          <div key={issueObj.id + '-' + issueObj.partType} className="flex items-center justify-between text-sm">
            <span className="text-gray-700">{displayName} ({issueObj.partType})</span>
            <span className="font-semibold text-primary">₹{match.price.toLocaleString()}</span>
          </div>
        );
      }
      return (
        <div key={issueObj.id} className="flex items-center justify-between text-sm">
          <span className="text-gray-700">{displayName}</span>
          <span className="font-semibold text-primary">₹{match.price.toLocaleString()}</span>
        </div>
      );
    } else {
      return (
        <div key={issueObj.id + (issueObj.partType ? '-' + issueObj.partType : '')} className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{displayName}{issueObj.partType ? ` (${issueObj.partType})` : ''}</span>
          <span className="text-red-500">Not offered</span>
        </div>
      );
    }
  });

  // Reset starting price if no services found
  if (startingPrice === Infinity) startingPrice = 0;

  return (
    <div className="group relative bg-white rounded-2xl border border-gray-200 p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
      
      {/* Header Section */}
      <div className="flex items-start gap-6 mb-8">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <img
            src={provider.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(provider.businessName || provider.name)}&background=374151&color=ffffff&size=128`}
            alt={provider.businessName || provider.name}
            className="w-20 h-20 rounded-full object-cover border-3 border-gray-200 shadow-sm"
          />
          {provider.isVerified && (
            <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>

        {/* Provider Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xl font-bold text-gray-900 truncate">
              {provider.businessName || provider.name}
            </h3>
          </div>
          
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-400" />
              <span>{provider.rating ? `${provider.rating.toFixed(1)} rating` : 'No rating'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span>{provider.yearsOfExperience ? `${provider.yearsOfExperience} years experience` : 'Experience N/A'}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span>{provider.location || 'Location N/A'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Services Section */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">
          Services for {selectedModel}
        </h4>
        <div className="space-y-3">
          {issueRows}
        </div>
      </div>

      {/* Total Estimate */}
      <div className="border-t border-gray-100 pt-4 mb-6">
        <div className="flex items-center justify-between">
          <span className="text-lg font-medium text-gray-700">Starting from</span>
          <span className="text-2xl font-bold text-primary">₹{totalEstimate.toLocaleString()}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button 
          variant="outline" 
          onClick={onViewProfile}
          className="flex-1 h-11 text-sm font-medium"
        >
          <FileText className="w-4 h-4 mr-2" />
          View Profile
        </Button>
        
        {/* Contact Dropdown */}
        <div className="relative flex-1" ref={dropdownRef}>
          <Button 
            onClick={() => setShowContactOptions(!showContactOptions)}
            className={`w-full h-11 text-sm font-medium flex items-center justify-center gap-2 ${
              hasActiveNegotiation || hasActiveConversation
                ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                : 'bg-primary hover:bg-primary/90 text-white'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            {hasActiveNegotiation || hasActiveConversation ? 'Chat' : 'Chat'}
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showContactOptions ? 'rotate-180' : ''}`} />
          </Button>
          
          {/* Dropdown Menu - Displaying Upward */}
          {showContactOptions && (
            <div className="absolute bottom-full mb-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-10">
              <button
                onClick={() => {
                  setShowContactOptions(false);
                  onGetQuote?.();
                }}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 border-b border-gray-100"
              >
                <span className="text-lg">💬</span>
                <div>
                  <div className="font-medium text-gray-900">Get Quote</div>
                  <div className="text-xs text-gray-500">Request a custom quote for your needs</div>
                </div>
                <ChevronDown className="w-4 h-4 ml-auto transform rotate-90 text-gray-400" />
              </button>
              
              <button
                onClick={() => {
                  setShowContactOptions(false);
                  onDirectChat?.();
                }}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3"
              >
                <span className="text-lg">💭</span>
                <div>
                  <div className="font-medium text-gray-900">
                    {hasActiveConversation ? 'Continue Chat' : 'Start Chat'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {hasActiveConversation 
                      ? 'Resume your existing conversation' 
                      : 'Start a new conversation with this provider'
                    }
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 ml-auto transform rotate-90 text-gray-400" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 