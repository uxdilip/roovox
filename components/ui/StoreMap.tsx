"use client";

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Phone, Clock, Navigation } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// Fix for default markers in react-leaflet
import L from 'leaflet';
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface StoreLocation {
  lat: number;
  lng: number;
  address: string;
  businessName?: string;
  phone?: string;
  hours?: string;
}

interface StoreMapProps {
  storeLocation: StoreLocation;
  customerLocation?: { lat: number; lng: number } | null;
  className?: string;
  showDirections?: boolean;
}

export function StoreMap({ 
  storeLocation, 
  customerLocation, 
  className = "",
  showDirections = true 
}: StoreMapProps) {
  const [distance, setDistance] = useState<number | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [copied, setCopied] = useState(false);

  // Ensure component renders on client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Calculate distance between customer and store
  useEffect(() => {
    if (customerLocation && storeLocation) {
      const R = 6371; // Earth's radius in km
      const dLat = (storeLocation.lat - customerLocation.lat) * Math.PI / 180;
      const dLon = (storeLocation.lng - customerLocation.lng) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(customerLocation.lat * Math.PI / 180) * Math.cos(storeLocation.lat * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;
      setDistance(distance);
    }
  }, [customerLocation, storeLocation]);

  const handleGetDirections = () => {
    const url = `https://www.openstreetmap.org/directions?from=&to=${storeLocation.lat},${storeLocation.lng}`;
    if (typeof window !== 'undefined') {
      window.open(url, '_blank');
    }
  };

  const handleCopyAddress = async () => {
    try {
      // Try modern clipboard API first
      if (typeof window !== 'undefined' && navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(storeLocation.address);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        // Fallback for older browsers or non-secure contexts
        if (typeof window !== 'undefined' && typeof document !== 'undefined') {
          const textArea = document.createElement('textarea');
          textArea.value = storeLocation.address;
          textArea.style.position = 'fixed';
          textArea.style.left = '-999999px';
          textArea.style.top = '-999999px';
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          try {
            document.execCommand('copy');
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } catch (err) {
            console.error('Failed to copy address:', err);
          }
          document.body.removeChild(textArea);
        }
      }
    } catch (err) {
      console.error('Failed to copy address:', err);
    }
  };

  const handleCallStore = () => {
    if (storeLocation.phone && typeof window !== 'undefined') {
      window.open(`tel:${storeLocation.phone}`, '_self');
    }
  };

  // Don't render map on server side
  if (!isClient) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Store Location
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Loading map...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          Store Location
          {distance && (
            <Badge variant="secondary" className="ml-auto">
              {distance.toFixed(1)} km away
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Map Container */}
        <div className={`relative ${isExpanded ? 'h-80' : 'h-48'} transition-all duration-300`}>
          <MapContainer
            center={[storeLocation.lat, storeLocation.lng]}
            zoom={15}
            className="w-full h-full rounded-lg"
            style={{ minHeight: isExpanded ? '320px' : '192px' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[storeLocation.lat, storeLocation.lng]}>
              <Popup>
                <div className="text-center">
                  <h3 className="font-semibold">{storeLocation.businessName || 'Store'}</h3>
                  <p className="text-sm text-gray-600">{storeLocation.address}</p>
                  {storeLocation.phone && (
                    <p className="text-sm text-gray-600">{storeLocation.phone}</p>
                  )}
                </div>
              </Popup>
            </Marker>
          </MapContainer>
          
          {/* Expand/Collapse Button */}
          <Button
            variant="outline"
            size="sm"
            className="absolute top-2 right-2 bg-white/90 hover:bg-white"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            type="button"
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </Button>
        </div>

        {/* Store Information */}
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium">{storeLocation.businessName || 'Store'}</p>
              <p className="text-sm text-gray-600">{storeLocation.address}</p>
            </div>
          </div>

          {storeLocation.phone && (
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-gray-500" />
              <p className="text-sm text-gray-600">{storeLocation.phone}</p>
            </div>
          )}

          {storeLocation.hours && (
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-gray-500" />
              <p className="text-sm text-gray-600">{storeLocation.hours}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 pt-2">
            {showDirections && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleGetDirections();
                }}
                className="flex items-center gap-2"
                type="button"
              >
                <Navigation className="h-4 w-4" />
                Get Directions
              </Button>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleCopyAddress();
              }}
              className="flex items-center gap-2"
              disabled={copied}
              type="button"
            >
              <MapPin className="h-4 w-4" />
              {copied ? 'Copied!' : 'Copy Address'}
            </Button>

            {storeLocation.phone && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleCallStore();
                }}
                className="flex items-center gap-2"
                type="button"
              >
                <Phone className="h-4 w-4" />
                Call Store
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 