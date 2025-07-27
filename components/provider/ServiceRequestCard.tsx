"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  MapPin, 
  DollarSign, 
  Phone, 
  MessageCircle,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { ServiceRequest } from '@/types/provider';

interface ServiceRequestCardProps {
  request: ServiceRequest;
  onAccept: (requestId: string) => void;
  onDecline: (requestId: string) => void;
  onContact: (requestId: string) => void;
}

export function ServiceRequestCard({ request, onAccept, onDecline, onContact }: ServiceRequestCardProps) {
  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'immediate': return 'bg-red-100 text-red-800';
      case 'same_day': return 'bg-orange-100 text-orange-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTimeRemaining = () => {
    const now = new Date();
    const expires = new Date(request.expires_at);
    const diff = expires.getTime() - now.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes <= 0) return 'Expired';
    if (minutes < 60) return `${minutes}m`;
    return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  };

  const timeRemaining = getTimeRemaining();
  const isExpired = timeRemaining === 'Expired';

  return (
    <Card className={`transition-all hover:shadow-md ${isExpired ? 'opacity-50' : ''}`}>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-lg">{request.customer_name}</h3>
                <Badge className={getUrgencyColor(request.urgency)}>
                  {request.urgency.replace('_', ' ')}
                </Badge>
              </div>
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <MapPin className="h-4 w-4" />
                  <span>{request.distance_from_provider.toFixed(1)} mi away</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>Expires in {timeRemaining}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-1 text-green-600">
                <DollarSign className="h-4 w-4" />
                <span className="font-semibold">
                  ${request.budget_range.min} - ${request.budget_range.max}
                </span>
              </div>
            </div>
          </div>

          {/* Device Info */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">
                {request.device_info.brand} {request.device_info.model}
              </span>
              <Badge variant="outline">{request.service_type}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              <strong>Issue:</strong> {request.device_info.issue_description}
            </p>
          </div>

          {/* Customer Details */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{request.customer_phone}</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{request.customer_address}</span>
            </div>
            {request.preferred_time && (
              <div className="flex items-center space-x-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>Preferred time: {new Date(request.preferred_time).toLocaleString()}</span>
              </div>
            )}
          </div>

          {/* Photos */}
          {request.device_info.photos.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Customer Photos:</p>
              <div className="flex space-x-2">
                {request.device_info.photos.slice(0, 3).map((photo, index) => (
                  <div key={index} className="w-16 h-16 bg-gray-200 rounded border">
                    <img 
                      src={photo} 
                      alt={`Device photo ${index + 1}`}
                      className="w-full h-full object-cover rounded"
                    />
                  </div>
                ))}
                {request.device_info.photos.length > 3 && (
                  <div className="w-16 h-16 bg-gray-100 rounded border flex items-center justify-center text-xs">
                    +{request.device_info.photos.length - 3}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Warning for urgent requests */}
          {request.urgency === 'immediate' && (
            <div className="flex items-center space-x-2 p-2 bg-orange-50 rounded border border-orange-200">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <span className="text-sm text-orange-700">
                Customer needs immediate assistance - respond quickly!
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-2 pt-2">
            {!isExpired ? (
              <>
                <Button 
                  onClick={() => onAccept(request.id)} 
                  className="flex-1"
                  disabled={isExpired}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Accept Request
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => onDecline(request.id)}
                  className="flex-1"
                >
                  Decline
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onContact(request.id)}
                >
                  <MessageCircle className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <div className="w-full text-center py-2 text-muted-foreground">
                Request Expired
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}