"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  CalendarIcon, 
  MapPin, 
  Clock, 
  Shield, 
  Briefcase, 
  CheckCircle,
  Star,
  Phone,
  MessageCircle,
  Lock
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function TestPage() {
  const [activeTab, setActiveTab] = useState<'provider' | 'customer'>('customer');
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [timeSlot, setTimeSlot] = useState('');
  const [serviceMode, setServiceMode] = useState<'doorstep' | 'instore'>('doorstep');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [phone, setPhone] = useState('+919663533450');
  const [isProcessing, setIsProcessing] = useState(false);

  // Mock offer data (simulating what would come from the database)
  const mockOffer = {
    id: '68a7654500274e7b89bd',
    price: '₹2,500',
    timeline: '1-2 Days',
    warranty: '90 days',
    parts_type: 'Original OEM Parts',
    description: 'Complete battery replacement with original parts and camera repair service. Includes testing and quality assurance.',
    selected_services: ['Battery Replacement', 'Camera Repair'],
    device_info: {
      category: 'phone',
      brand: 'Google',
      model: 'Pixel 4a 5G'
    },
    provider: {
      name: 'TechFix Pro',
      rating: 4.8,
      reviews: 127,
      verified: true,
      experience: '5+ years'
    }
  };

  const timeSlots = [
    '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM',
    '05:00 PM', '06:00 PM'
  ];

  const handleAcceptOffer = () => {
    setShowBookingForm(true);
  };

  const handleSubmitBooking = async () => {
    if (!selectedDate || !timeSlot || !phone.trim()) {
      alert('Please fill all required fields');
      return;
    }

    setIsProcessing(true);
    
    // Simulate processing
    setTimeout(() => {
      setIsProcessing(false);
      alert('Booking submitted successfully! Redirecting to payment...');
      // Here you would redirect to payment page
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Offer-Based Booking System
          </h1>
          <p className="text-gray-600">
            Test the new streamlined booking flow for accepted offers
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg p-1 shadow-sm border">
            <button
              onClick={() => setActiveTab('provider')}
              className={cn(
                'px-6 py-2 rounded-md text-sm font-medium transition-colors',
                activeTab === 'provider'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              Provider View
            </button>
            <button
              onClick={() => setActiveTab('customer')}
              className={cn(
                'px-6 py-2 rounded-md text-sm font-medium transition-colors',
                activeTab === 'provider'
                  ? 'text-gray-600 hover:text-gray-900'
                  : 'bg-blue-600 text-white shadow-sm'
              )}
            >
              Customer View
            </button>
          </div>
        </div>

        {activeTab === 'provider' && (
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2">
                  <MessageCircle className="h-5 w-5 text-blue-600" />
                  Provider Chat Dashboard
                </CardTitle>
                <p className="text-gray-600">
                  Create and manage offers for customers
                </p>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => setShowOfferModal(true)}
                  className="w-full"
                  size="lg"
                >
                  <Briefcase className="h-4 w-4 mr-2" />
                  Create New Offer
                </Button>
              </CardContent>
            </Card>

            {/* Create Offer Modal */}
            {showOfferModal && (
              <Card className="mt-6 border-2 border-blue-200">
                <CardHeader className="bg-blue-50">
                  <CardTitle className="text-blue-900">Create Custom Offer</CardTitle>
                  <p className="text-blue-700 text-sm">
                    Fill in the offer details for your customer
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="price">Price (₹)</Label>
                      <Input id="price" placeholder="2500" />
                    </div>
                    <div>
                      <Label htmlFor="timeline">Timeline</Label>
                      <select className="w-full p-2 border rounded-md">
                        <option>Same Day</option>
                        <option>1-2 Days</option>
                        <option>3-5 Days</option>
                        <option>1 Week</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="warranty">Warranty</Label>
                      <Input id="warranty" placeholder="90 days" />
                    </div>
                    <div>
                      <Label htmlFor="parts">Parts Quality</Label>
                      <select className="w-full p-2 border rounded-md">
                        <option>Original OEM Parts</option>
                        <option>Aftermarket High Quality</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Service Description</Label>
                    <Textarea 
                      id="description" 
                      placeholder="Describe what services you'll provide..."
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button 
                      onClick={() => setShowOfferModal(false)}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button className="flex-1">
                      Send Offer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'customer' && (
          <div className="max-w-6xl mx-auto">
            {!showBookingForm ? (
              /* Offer Display - Clean, Fiverr-style */
              <div className="max-w-2xl mx-auto">
                <Card className="border-0 shadow-lg">
                  <CardHeader className="text-center pb-6">
                    <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <CardTitle className="text-green-900 text-2xl font-bold">
                      Great News! Your Offer Has Been Accepted
                    </CardTitle>
                    <p className="text-green-700 text-lg">
                      Complete your booking to proceed with the service
                    </p>
                  </CardHeader>
                  
                  <CardContent className="space-y-6">
                    {/* Offer Summary - Clean card design */}
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h3 className="font-semibold text-gray-900 text-lg mb-4">Offer Summary</h3>
                      
                      <div className="space-y-4">
                        <div className="flex justify-between items-center py-2">
                          <span className="text-gray-600">Device</span>
                          <span className="font-medium text-gray-900">{mockOffer.device_info.brand} {mockOffer.device_info.model}</span>
                        </div>
                        
                        <div className="flex justify-between items-center py-2">
                          <span className="text-gray-600">Services</span>
                          <span className="font-medium text-gray-900">{mockOffer.selected_services.join(', ')}</span>
                        </div>
                        
                        <div className="flex justify-between items-center py-2">
                          <span className="text-gray-600">Timeline</span>
                          <span className="font-medium text-gray-900">{mockOffer.timeline}</span>
                        </div>
                        
                        <div className="flex justify-between items-center py-2">
                          <span className="text-gray-600">Warranty</span>
                          <span className="font-medium text-gray-900">{mockOffer.warranty}</span>
                        </div>
                        
                        <Separator className="my-4" />
                        
                        <div className="flex justify-between items-center py-2">
                          <span className="text-gray-600 text-lg">Total Price</span>
                          <span className="text-3xl font-bold text-green-600">{mockOffer.price}</span>
                        </div>
                      </div>
                    </div>

                    {/* Provider Info - Clean, minimal */}
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h3 className="font-semibold text-gray-900 text-lg mb-4">Service Provider</h3>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold text-lg">
                            {mockOffer.provider.name.charAt(0)}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 text-lg">{mockOffer.provider.name}</h4>
                          <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span className="font-medium">{mockOffer.provider.rating}</span>
                            </div>
                            <span>•</span>
                            <span>{mockOffer.provider.reviews} reviews</span>
                            <span>•</span>
                            <span>{mockOffer.provider.experience}</span>
                            {mockOffer.provider.verified && (
                              <Badge variant="secondary" className="text-xs">Verified</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Button - Prominent */}
                    <Button 
                      onClick={handleAcceptOffer}
                      className="w-full h-14 text-lg font-semibold"
                      size="lg"
                    >
                      Complete Your Booking
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ) : (
              /* Clean, Fiverr-style Booking Form */
              <div className="max-w-5xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Main Form - Left Column */}
                  <div className="lg:col-span-2">
                    <Card className="border-0 shadow-lg">
                      <CardHeader className="border-b pb-6">
                        <CardTitle className="text-2xl font-bold text-gray-900">
                          Complete Your Booking
                        </CardTitle>
                        <p className="text-gray-600 text-lg">
                          Just a few details to finalize your service appointment
                        </p>
                      </CardHeader>
                      
                      <CardContent className="p-8">
                        <div className="space-y-8">
                          {/* Appointment Details */}
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Appointment Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                <Label htmlFor="date" className="text-sm font-medium text-gray-700 mb-2 block">
                                  Preferred Date
                                </Label>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant="outline"
                                      className={cn(
                                        "w-full h-12 justify-start text-left font-normal border-gray-300",
                                        !selectedDate && "text-gray-500"
                                      )}
                                    >
                                      <CalendarIcon className="mr-2 h-4 w-4" />
                                      {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0">
                                    <Calendar
                                      mode="single"
                                      selected={selectedDate}
                                      onSelect={setSelectedDate}
                                      initialFocus
                                      disabled={(date) => date < new Date()}
                                    />
                                  </PopoverContent>
                                </Popover>
                              </div>
                              
                              <div>
                                <Label htmlFor="time" className="text-sm font-medium text-gray-700 mb-2 block">
                                  Preferred Time
                                </Label>
                                <select
                                  id="time"
                                  value={timeSlot}
                                  onChange={(e) => setTimeSlot(e.target.value)}
                                  className="w-full h-12 p-3 border border-gray-300 rounded-md text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                  <option value="">Select time</option>
                                  {timeSlots.map((slot) => (
                                    <option key={slot} value={slot}>{slot}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </div>

                          {/* Service Mode */}
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Mode</h3>
                            <RadioGroup value={serviceMode} onValueChange={(value: 'doorstep' | 'instore') => setServiceMode(value)}>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className={`flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                                  serviceMode === 'doorstep' 
                                    ? 'border-blue-500 bg-blue-50' 
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}>
                                  <RadioGroupItem value="doorstep" id="doorstep" />
                                  <Label htmlFor="doorstep" className="cursor-pointer flex-1">
                                    <div className="flex items-center gap-3">
                                      <MapPin className="h-5 w-5 text-blue-600" />
                                      <div>
                                        <div className="font-semibold text-gray-900">Doorstep Service</div>
                                        <div className="text-sm text-gray-600">We'll come to your location</div>
                                      </div>
                                    </div>
                                  </Label>
                                </div>
                                
                                <div className={`flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                                  serviceMode === 'instore' 
                                    ? 'border-blue-500 bg-blue-50' 
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}>
                                  <RadioGroupItem value="instore" id="instore" />
                                  <Label htmlFor="instore" className="cursor-pointer flex-1">
                                    <div className="flex items-center gap-3">
                                      <Briefcase className="h-5 w-5 text-green-600" />
                                      <div>
                                        <div className="font-semibold text-gray-900">Visit Store</div>
                                        <div className="text-sm text-gray-600">Drop off at our service center</div>
                                      </div>
                                    </div>
                                  </Label>
                                </div>
                              </div>
                            </RadioGroup>
                          </div>

                          {/* Contact Details */}
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Details</h3>
                            <div>
                              <Label htmlFor="phone" className="text-sm font-medium text-gray-700 mb-2 block">
                                Phone Number
                              </Label>
                              <div className="flex gap-3">
                                <Input
                                  id="phone"
                                  value={phone}
                                  onChange={(e) => setPhone(e.target.value)}
                                  placeholder="Enter your phone number"
                                  className="h-12 text-base"
                                />
                                <Button variant="outline" size="sm" className="h-12 px-4">
                                  Edit
                                </Button>
                              </div>
                            </div>
                          </div>

                          {/* Additional Notes */}
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Notes (Optional)</h3>
                            <Textarea
                              placeholder="Any special instructions or additional information..."
                              value={additionalNotes}
                              onChange={(e) => setAdditionalNotes(e.target.value)}
                              rows={3}
                              className="border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Order Summary - Right Column (Fiverr-style) */}
                  <div className="lg:col-span-1">
                    <Card className="sticky top-6 border-0 shadow-lg">
                      <CardHeader className="border-b pb-4">
                        <CardTitle className="text-xl font-bold text-gray-900">Order Summary</CardTitle>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          {/* Service Details */}
                          <div className="flex items-start gap-3 pb-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <span className="text-blue-600 font-semibold text-sm">
                                {mockOffer.device_info.brand.charAt(0)}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-900 font-medium leading-tight">
                                {mockOffer.selected_services.join(', ')}
                              </p>
                              <p className="text-sm text-gray-600 mt-1">
                                {mockOffer.device_info.brand} {mockOffer.device_info.model}
                              </p>
                            </div>
                          </div>

                          <Separator />

                          {/* Price Breakdown */}
                          <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Service</span>
                              <span className="text-gray-900">{mockOffer.price}</span>
                            </div>
                  
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Service Mode</span>
                              <span className="text-gray-900 capitalize">{serviceMode}</span>
                            </div>
                            
                            <Separator />
                            
                            <div className="flex justify-between text-lg font-bold">
                              <span>Total</span>
                              <span className="text-green-600">{mockOffer.price}</span>
                            </div>
                          </div>

                          {/* Payment Button */}
                          <Button 
                            onClick={handleSubmitBooking}
                            className="w-full h-12 text-base font-semibold mt-6"
                            size="lg"
                            disabled={!selectedDate || !timeSlot || !phone.trim() || isProcessing}
                          >
                            {isProcessing ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Processing...
                              </>
                            ) : (
                              'Proceed to Payment'
                            )}
                          </Button>
                          
                          {/* Security & Terms */}
                          <div className="text-center pt-4">
                            <div className="flex items-center justify-center gap-2 text-xs text-gray-500 mb-2">
                              <Lock className="h-3 w-3" />
                              SSL Secure Payment
                            </div>
                            <p className="text-xs text-gray-500">
                              By clicking the button, you agree to our Terms of Service
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

