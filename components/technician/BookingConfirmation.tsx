"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  CheckCircle, 
  Clock, 
  MapPin, 
  Phone, 
  MessageCircle,
  Calendar,
  DollarSign,
  Star,
  Copy,
  ExternalLink
} from 'lucide-react';
import { Technician, PartInspectionRequest, BookingConfirmation as BookingConfirmationType } from '@/types/technician';

interface BookingConfirmationProps {
  technician: Technician;
  inspectionRequest: PartInspectionRequest;
  onBack: () => void;
}

export function BookingConfirmation({ technician, inspectionRequest, onBack }: BookingConfirmationProps) {
  const [serviceType, setServiceType] = useState<'immediate' | 'scheduled'>('immediate');
  const [scheduledTime, setScheduledTime] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [isConfirmed, setIsConfirmed] = useState(false);

  const [bookingDetails] = useState<BookingConfirmationType>({
    id: 'BK' + Date.now(),
    technician,
    appointment_time: serviceType === 'immediate' ? 'ASAP' : scheduledTime,
    service_type: serviceType,
    estimated_arrival: serviceType === 'immediate' ? `${technician.estimated_arrival} minutes` : scheduledTime,
    total_cost: calculateTotalCost(),
    tracking_code: 'TRK' + Math.random().toString(36).substr(2, 9).toUpperCase(),
    chat_room_id: 'CHAT' + Date.now()
  });

  function calculateTotalCost() {
    const baseRate = technician.pricing.base_rate;
    const travelFee = technician.pricing.travel_fee;
    const emergencyMultiplier = serviceType === 'immediate' ? 1.2 : 1;
    const estimatedHours = 1.5; // Estimated time for inspection
    
    return Math.round((baseRate * estimatedHours * emergencyMultiplier) + travelFee);
  }

  const handleConfirmBooking = () => {
    setIsConfirmed(true);
  };

  const copyTrackingCode = () => {
    navigator.clipboard.writeText(bookingDetails.tracking_code);
  };

  if (isConfirmed) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-green-600 mb-2">Booking Confirmed!</h2>
          <p className="text-muted-foreground">
            Your technician has been notified and will contact you shortly.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Booking Details */}
          <Card>
            <CardHeader>
              <CardTitle>Booking Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Booking ID:</span>
                <span className="font-mono font-semibold">{bookingDetails.id}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span>Tracking Code:</span>
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-semibold">{bookingDetails.tracking_code}</span>
                  <Button variant="ghost" size="sm" onClick={copyTrackingCode}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span>Service Type:</span>
                <Badge variant={serviceType === 'immediate' ? 'default' : 'secondary'}>
                  {serviceType === 'immediate' ? 'Immediate Service' : 'Scheduled Service'}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span>Estimated Arrival:</span>
                <span className="font-semibold">{bookingDetails.estimated_arrival}</span>
              </div>

              <div className="flex items-center justify-between">
                <span>Total Cost:</span>
                <span className="text-lg font-bold">${bookingDetails.total_cost}</span>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <span>Device:</span>
                  <span>{inspectionRequest.device_info.brand} {inspectionRequest.device_info.model}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Part:</span>
                  <span>{inspectionRequest.part_details.part_type}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Quality:</span>
                  <span className="capitalize">{inspectionRequest.part_details.quality_preference}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Technician Info */}
          <Card>
            <CardHeader>
              <CardTitle>Your Technician</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4 mb-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={technician.profile_photo} alt={technician.first_name} />
                  <AvatarFallback>
                    {technician.first_name.charAt(0)}{technician.last_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">
                    {technician.first_name} {technician.last_name}
                  </h3>
                  <p className="text-muted-foreground">{technician.business_name}</p>
                  <div className="flex items-center space-x-1 mt-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">{technician.overall_rating.toFixed(1)}</span>
                    <span className="text-sm text-muted-foreground">
                      ({technician.total_reviews} reviews)
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <Button variant="outline" className="flex items-center space-x-2">
                  <Phone className="h-4 w-4" />
                  <span>Call</span>
                </Button>
                <Button variant="outline" className="flex items-center space-x-2">
                  <MessageCircle className="h-4 w-4" />
                  <span>Message</span>
                </Button>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{technician.distance_from_customer?.toFixed(1)} miles away</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>Avg response: {technician.response_time_avg} minutes</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Next Steps */}
        <Card>
          <CardHeader>
            <CardTitle>What Happens Next?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-semibold text-blue-600">1</span>
                </div>
                <div>
                  <h4 className="font-semibold">Technician Notification</h4>
                  <p className="text-sm text-muted-foreground">
                    {technician.first_name} has been notified and will contact you within {technician.response_time_avg} minutes.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-semibold text-blue-600">2</span>
                </div>
                <div>
                  <h4 className="font-semibold">Arrival & Inspection</h4>
                  <p className="text-sm text-muted-foreground">
                    The technician will arrive at your location and perform the part inspection.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-semibold text-blue-600">3</span>
                </div>
                <div>
                  <h4 className="font-semibold">Quote & Repair</h4>
                  <p className="text-sm text-muted-foreground">
                    You'll receive a detailed quote and can proceed with the repair if satisfied.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button className="flex-1" asChild>
            <a href={`/tracking/${bookingDetails.tracking_code}`}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Track Your Service
            </a>
          </Button>
          <Button variant="outline" className="flex-1" asChild>
            <a href={`/chat/${bookingDetails.chat_room_id}`}>
              <MessageCircle className="h-4 w-4 mr-2" />
              Chat with Technician
            </a>
          </Button>
          <Button variant="outline" onClick={onBack}>
            Book Another Service
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Confirm Your Booking</h2>
          <p className="text-muted-foreground">
            Review the details and confirm your service appointment
          </p>
        </div>
        <Button variant="ghost" onClick={onBack}>
          ← Back
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Booking Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Service Timing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Service Timing</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={serviceType} onValueChange={(value: 'immediate' | 'scheduled') => setServiceType(value)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="immediate" id="immediate" />
                  <Label htmlFor="immediate" className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Immediate Service</div>
                        <div className="text-sm text-muted-foreground">
                          Technician will arrive in {technician.estimated_arrival} minutes
                        </div>
                      </div>
                      <Badge className="bg-orange-100 text-orange-800">+20% fee</Badge>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="scheduled" id="scheduled" />
                  <Label htmlFor="scheduled" className="flex-1">
                    <div>
                      <div className="font-medium">Scheduled Service</div>
                      <div className="text-sm text-muted-foreground">
                        Choose a convenient time slot
                      </div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>

              {serviceType === 'scheduled' && (
                <div className="mt-4">
                  <Label htmlFor="scheduled-time">Select Date & Time</Label>
                  <Input
                    id="scheduled-time"
                    type="datetime-local"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                    className="mt-2"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Special Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>Special Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder="Any special instructions for the technician (e.g., building access, parking, specific requirements)..."
                rows={4}
              />
            </CardContent>
          </Card>

          {/* Service Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Service Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span>Device:</span>
                <span>{inspectionRequest.device_info.brand} {inspectionRequest.device_info.model}</span>
              </div>
              <div className="flex justify-between">
                <span>Part Type:</span>
                <span>{inspectionRequest.part_details.part_type}</span>
              </div>
              <div className="flex justify-between">
                <span>Quality Preference:</span>
                <span className="capitalize">{inspectionRequest.part_details.quality_preference}</span>
              </div>
              <div className="flex justify-between">
                <span>Service Location:</span>
                <span>{inspectionRequest.customer_location.address}</span>
              </div>
              <div className="flex justify-between">
                <span>Urgency:</span>
                <Badge variant="outline" className="capitalize">
                  {inspectionRequest.urgency}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Booking Summary */}
        <div className="space-y-6">
          {/* Technician Card */}
          <Card>
            <CardHeader>
              <CardTitle>Selected Technician</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-3 mb-4">
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
                  <div className="flex items-center space-x-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs">{technician.overall_rating.toFixed(1)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Experience:</span>
                  <span>{technician.experience_years}+ years</span>
                </div>
                <div className="flex justify-between">
                  <span>Distance:</span>
                  <span>{technician.distance_from_customer?.toFixed(1)} mi</span>
                </div>
                <div className="flex justify-between">
                  <span>Response Time:</span>
                  <span>{technician.response_time_avg} min</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cost Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5" />
                <span>Cost Breakdown</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span>Base Rate (1.5 hrs):</span>
                <span>${(technician.pricing.base_rate * 1.5).toFixed(0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Travel Fee:</span>
                <span>${technician.pricing.travel_fee}</span>
              </div>
              {serviceType === 'immediate' && (
                <div className="flex justify-between text-orange-600">
                  <span>Emergency Fee (20%):</span>
                  <span>+${Math.round(technician.pricing.base_rate * 1.5 * 0.2)}</span>
                </div>
              )}
              <div className="border-t pt-3">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>${calculateTotalCost()}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Final cost may vary based on actual repair time and parts needed
              </p>
            </CardContent>
          </Card>

          {/* Confirm Button */}
          <Button 
            onClick={handleConfirmBooking} 
            className="w-full" 
            size="lg"
            disabled={serviceType === 'scheduled' && !scheduledTime}
          >
            Confirm Booking
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            By confirming, you agree to our terms of service and cancellation policy.
          </p>
        </div>
      </div>
    </div>
  );
}