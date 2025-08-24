"use client";

import React, { useState } from 'react';
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
    <div className="group relative bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
      
      {/* Header Section */}
      <div className="flex items-start gap-4 mb-6">
        {/* Avatar */}
        <div className="relative">
          <img
            src={provider.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(provider.businessName || provider.name)}&background=374151&color=ffffff&size=128`}
            alt={provider.businessName || provider.name}
            className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
          />
          {provider.isVerified && (
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>

        {/* Provider Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-bold text-lg text-gray-900 truncate">
              {provider.businessName || provider.name}
            </h3>
          </div>
          
          {/* Rating and Experience */}
          <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
            {provider.rating ? (
              <div className="flex items-center gap-1">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className={`w-4 h-4 ${i < Math.floor(provider.rating!) ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="font-medium">{provider.rating.toFixed(1)}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-gray-400">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span>No rating</span>
              </div>
            )}
            
            {provider.yearsOfExperience ? (
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <span>{provider.yearsOfExperience}+ years</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-gray-400">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <span>Experience N/A</span>
              </div>
            )}
          </div>

          {/* Location */}
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            <span className="truncate">{provider.location || 'Location N/A'}</span>
          </div>
        </div>
      </div>

      {/* Services Section */}
      <div className="mb-6">
        <h4 className="font-semibold text-gray-900 mb-3">Services for {selectedModel}</h4>
        <div className="space-y-2">
          {issueRows}
        </div>
      </div>

      {/* Total Price and Actions */}
      <div className="border-t border-gray-200 pt-4">
        <div className="text-center mb-4">
          <p className="text-sm text-gray-600">Total estimate</p>
          <p className="text-3xl font-bold text-gray-900">
            ₹{totalEstimate.toLocaleString()}
          </p>
        </div>

        {/* Negotiation Status */}
        {hasActiveNegotiation && (
          <div className="mb-3 flex items-center justify-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              Chat in Progress
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onViewProfile}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
          >
            View Profile
          </button>
          
          {/* Contact Dropdown */}
          <div className="relative flex-1">
                      <button
            onClick={() => setShowContactOptions(!showContactOptions)}
            className={`w-full px-4 py-2.5 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200 flex items-center justify-center gap-2 ${
              hasActiveNegotiation || hasActiveConversation
                ? 'text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 focus:ring-blue-500'
                : 'text-white bg-black hover:bg-gray-800 focus:ring-gray-500'
            }`}
          >
            {hasActiveNegotiation ? 'Continue Chat' : hasActiveConversation ? 'Continue Chat' : 'Contact me'}
            <ChevronDown className="h-4 w-4" />
          </button>
            
            {/* Dropdown Menu */}
            {showContactOptions && (
              <div className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                {CONTACT_OPTIONS.map((option) => (
                                      <button
                      key={option.type}
                      onClick={() => {
                        setShowContactOptions(false);
                        if (option.type === 'quote') {
                          onGetQuote?.();
                        } else if (option.type === 'chat') {
                          onDirectChat?.();
                        }
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 border-b border-gray-100 last:border-b-0"
                    >
                      <span className="text-lg">{option.icon}</span>
                      <div>
                        <div className="font-medium text-gray-900">
                          {option.type === 'chat' && hasActiveConversation ? 'Continue Chat' : option.label}
                        </div>
                        <div className="text-xs text-gray-500">
                          {option.type === 'chat' && hasActiveConversation 
                            ? 'Resume your existing conversation' 
                            : option.description
                          }
                        </div>
                      </div>
                      <ChevronDown className="h-4 w-4 ml-auto transform rotate-90 text-gray-400" />
                    </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}; 