"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon, MapPin } from 'lucide-react';
import { Device, Service, PartQuality } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import {
  createAddress,
  updateAddress,
  deleteAddress,
  getAddressesByUser,
  setDefaultAddress,
  updateUserPhone,
  createBooking
} from '@/lib/appwrite-services';
import { useLocation, LocationData } from '@/contexts/LocationContext';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import LocationSelector from '@/components/LocationSelector';
import { databases, DATABASE_ID } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { StoreMap } from '@/components/ui/StoreMap';
import { geocodeAddress, formatAddressForGeocoding } from '@/lib/geocoding';

interface BookingFormProps {
  device: Device;
  service: Service;
  issues?: Service[];
  partQuality: PartQuality;
  onSubmit: (bookingData: any) => void;
  onBack: () => void;
  phone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  providerId?: string;
  providerPrice?: number | string;
  providerServices?: Array<{ issue: string; price: number; partType?: string; warranty?: string }>;
}

export function BookingForm({
  device,
  service,
  issues,
  partQuality,
  onSubmit,
  onBack,
  phone: initialPhone = '',
  address: initialAddress = { street: '', city: '', state: '', zip: '' },
  providerId,
  providerPrice,
  providerServices
}: BookingFormProps) {
  
  // Debug logging for provider services
  console.log('🔍 BookingForm Debug:', {
    providerId,
    providerPrice,
    providerServices,
    providerServicesWithWarranty: providerServices?.map(ps => ({ 
      issue: ps.issue, 
      price: ps.price, 
      partType: ps.partType, 
      warranty: ps.warranty 
    })),
    issues: issues?.map(i => ({ id: i.id, name: i.name })),
    partQuality
  });
  
  const [date, setDate] = useState<Date>();
  const [timeSlot, setTimeSlot] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [address, setAddress] = useState({
    zip: '',
    flat: '',
    street: '',
    landmark: '',
    city: '',
    alternate: '',
    label: 'Home',
    is_default: false,
  });
  const [issueDescription, setIssueDescription] = useState('');
  const [phone, setPhone] = useState(initialPhone);
  const [editingPhone, setEditingPhone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serviceMode, setServiceMode] = useState<'doorstep' | 'instore'>('doorstep');
  const [availableServiceModes, setAvailableServiceModes] = useState<Array<'doorstep' | 'instore'>>(['doorstep', 'instore']);
  const [storeAddress, setStoreAddress] = useState<any>(null);
  const [storeLocation, setStoreLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [storeLocationLoading, setStoreLocationLoading] = useState(false);

  const { user, setUser } = useAuth();
  const [addresses, setAddresses] = useState<Array<any>>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showAddressDialog, setShowAddressDialog] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any | null>(null);
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const { location: customerLocation, setLocation } = useLocation();
  const { toast } = useToast();
  const [savingAddress, setSavingAddress] = useState(false);
  const [addressSaved, setAddressSaved] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (user?.id) {
      getAddressesByUser(user.id).then((addrs) => {
        setAddresses(addrs);
        const def = addrs.find(a => a.is_default);
        setSelectedAddressId(def ? def.$id : addrs[0]?.$id || null);
      });
      if (user.phone) setPhone(user.phone);
    }
  }, [user]);

  useEffect(() => {
    if (providerId && date) {
      setSlotsLoading(true);
      fetch(`/api/providers?availableSlots=1&providerId=${providerId}&date=${format(date, 'yyyy-MM-dd')}`)
        .then(res => res.json())
        .then(data => {
          setAvailableSlots(data.slots || []);
          setSlotsLoading(false);
        })
        .catch(() => {
          setAvailableSlots([]);
          setSlotsLoading(false);
        });
    } else {
      setAvailableSlots([]);
    }
  }, [providerId, date]);

  useEffect(() => {
    // If providerId is present, fetch provider's serviceMode and store address
    if (providerId) {
      (async () => {
        const res = await databases.listDocuments(
          DATABASE_ID,
          'business_setup',
          [Query.equal('user_id', providerId), Query.limit(1)]
        );
        let onboarding = {};
        try { onboarding = res.documents[0] ? JSON.parse(res.documents[0].onboarding_data || '{}') : {}; } catch { onboarding = {}; }
        const serviceSetup = (onboarding as any)?.serviceSetup || {};
        const mode = serviceSetup?.serviceMode || 'both';
        const location = serviceSetup?.location || null;
        setStoreAddress(location);
        
        // Geocode store address if available
        if (location && location.address) {
          setStoreLocationLoading(true);
          try {
            const formattedAddress = formatAddressForGeocoding(location.address);
            const geocodedResult = await geocodeAddress(formattedAddress);
            if (geocodedResult) {
              setStoreLocation({
                lat: geocodedResult.lat,
                lng: geocodedResult.lng,
                address: location.address
              });
            }
          } catch (error) {
            console.error('Error geocoding store address:', error);
          } finally {
            setStoreLocationLoading(false);
          }
        }
        
        if (mode === 'doorstep') {
          setAvailableServiceModes(['doorstep']);
          setServiceMode('doorstep');
        } else if (mode === 'instore') {
          setAvailableServiceModes(['instore']);
          setServiceMode('instore');
        } else {
          setAvailableServiceModes(['doorstep', 'instore']);
          setServiceMode('doorstep');
        }
      })();
    }
  }, [providerId]);

  const handleAddOrEditAddress = async (addressData: Record<string, any>, editingId: string | null = null) => {
    if (!user?.id) return;
    let newAddresses;
    if (editingId) {
      await updateAddress(editingId, addressData);
      newAddresses = await getAddressesByUser(user.id);
    } else {
      await createAddress({ ...addressData, user_id: user.id, is_default: addresses.length === 0 });
      newAddresses = await getAddressesByUser(user.id);
    }
    setAddresses(newAddresses);
    const def = newAddresses.find(a => a.is_default);
    setSelectedAddressId(def ? def.$id : newAddresses[0]?.$id || null);
    setShowAddressDialog(false);
    setEditingAddress(null);
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!user?.id) return;
    await deleteAddress(addressId);
    const newAddresses = await getAddressesByUser(user.id);
    setAddresses(newAddresses);
    const def = newAddresses.find(a => a.is_default);
    setSelectedAddressId(def ? def.$id : newAddresses[0]?.$id || null);
  };

  const handleSetDefaultAddress = async (addressId: string) => {
    if (!user?.id) return;
    await setDefaultAddress(addressId, user.id);
    const newAddresses = await getAddressesByUser(user.id);
    setAddresses(newAddresses);
    setSelectedAddressId(addressId);
  };

  const handlePhoneChange = async (val: string) => {
    setPhone(val);
    if (user?.id) {
      await updateUserPhone(user.id, val);
      setUser && setUser({ ...user, phone: val });
    }
  };

  const totalAmount = Math.round(service.base_price * partQuality.price_multiplier);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleServiceTypeSelect();
  };
    
  const handleServiceTypeSelect = async () => {
    if (!user) return;
    // Set part_quality only for Screen Replacement
    const screenIssue = (issues || [service]).find(
      s => s.name && s.name.toLowerCase().includes('screen replacement')
    );
    const part_quality = screenIssue ? partQuality.tier : '';
    // Gather booking data
    const baseBookingData = {
      customer_id: user.id,
      provider_id: providerId || '',
      device_id: device.id,
      service_id: service.id,
      issue_description: issueDescription,
      selected_issues: JSON.stringify(issues ? issues.map(i => ({ id: i.id, name: i.name })) : [{ id: service.id, name: service.name }]),
      warranty: (issues && issues.length > 0)
        ? issues.map(s => {
        const q = s.part_qualities?.find(q => q.tier === partQuality.tier) || partQuality;
            return `${s.name}: ${Math.floor((q.warranty_days || 0) / 30)} months`;
          }).join(', ')
        : (() => {
            const q = service.part_qualities?.find(q => q.tier === partQuality.tier) || partQuality;
            return `${service.name}: ${Math.floor((q.warranty_days || 0) / 30)} months`;
          })(),
      serviceMode: serviceMode,
      location_type: serviceMode === 'instore' ? 'provider_location' : 'doorstep',
      customer_address: serviceMode === 'doorstep' ? JSON.stringify(address) : null,
      appointment_time: date && timeSlot ? new Date(`${format(date, 'yyyy-MM-dd')} ${timeSlot}`).toISOString() : '',
      total_amount: issues && issues.length > 0
        ? issues.reduce((sum, s) => {
            let price = Math.round((s.base_price || 0) * (partQuality.price_multiplier || 1));
            console.log('🔍 Total amount calculation - Starting with base price:', price, 'for service:', s.name);
            
            if (typeof providerServices !== 'undefined' && Array.isArray(providerServices)) {
              
              // Normalize part quality tier to match database format
              const normalizedPartType = partQuality.tier === 'oem' ? 'OEM' : 'High Quality';
              
              // First try to find exact match with partType using issue name
              let match = providerServices.find(
                so => so.issue === s.name && so.partType && so.partType === normalizedPartType
              );
              
              // If no exact match, try to find any service for this issue (fallback)
              if (!match) {
                match = providerServices.find(so => so.issue === s.name);
              }
              
              // If still no match, try to match by base issue name (for screen replacement)
              if (!match && (s.name.includes(' - ') || s.name.includes(' – '))) {
                const baseIssueName = s.name.includes(' - ') ? s.name.split(' - ')[0] : s.name.split(' – ')[0];
                match = providerServices.find(
                  so => so.issue === baseIssueName && so.partType && so.partType === normalizedPartType
                );
                if (!match) {
                  match = providerServices.find(so => so.issue === baseIssueName);
                }
              }
              
              if (match && match.price) {
                price = match.price;
                console.log('✅ Total amount calculation - Using provider price:', price, 'for service:', s.name);
              } else {
                console.log('❌ Total amount calculation - No provider match found, using fallback price:', price, 'for service:', s.name);
              }
            }
            return sum + price;
          }, 0)
        : (() => {
            let price = Math.round(service.base_price * partQuality.price_multiplier);
            console.log('🔍 Total amount calculation - Starting with base price:', price, 'for service:', service.name);
            
            if (typeof providerServices !== 'undefined' && Array.isArray(providerServices)) {
              
              // Normalize part quality tier to match database format
              const normalizedPartType = partQuality.tier === 'oem' ? 'OEM' : 'High Quality';
              
              // First try to find exact match with partType using issue name
              let match = providerServices.find(
                so => so.issue === service.name && so.partType && so.partType === normalizedPartType
              );
              
              // If no exact match, try to find any service for this issue (fallback)
              if (!match) {
                match = providerServices.find(so => so.issue === service.name);
              }
              
              // If still no match, try to match by base issue name (for screen replacement)
              if (!match && (service.name.includes(' - ') || service.name.includes(' – '))) {
                const baseIssueName = service.name.includes(' - ') ? service.name.split(' - ')[0] : service.name.split(' – ')[0];
                match = providerServices.find(
                  so => so.issue === baseIssueName && so.partType && so.partType === normalizedPartType
                );
                if (!match) {
                  match = providerServices.find(so => so.issue === baseIssueName);
                }
              }
              
              if (match && match.price) {
                price = match.price;
                console.log('✅ Total amount calculation (fallback) - Using provider price:', price, 'for service:', service.name);
              } else {
                console.log('❌ Total amount calculation (fallback) - No provider match found, using fallback price:', price, 'for service:', service.name);
              }
            }
            return price;
          })(),
      status: 'pending',
      payment_status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      review: null,
      rating: null,
    };
    // Only include part_quality if it is 'oem' or 'hq'
    const bookingData = (part_quality === 'oem' || part_quality === 'hq')
      ? { ...baseBookingData, part_quality }
      : baseBookingData;
    // Validate required fields
    if (!bookingData.customer_id || !bookingData.provider_id || !bookingData.device_id || !bookingData.service_id || !bookingData.selected_issues || bookingData.selected_issues.length === 0 || !bookingData.total_amount || !bookingData.appointment_time) {
      toast({ title: 'Error', description: 'Please fill all required fields.' });
      return;
    }
    setSubmitting(true);
    try {
      // Store booking data in sessionStorage instead of creating document
      const sessionKey = `pending_booking_${Date.now()}`;
      
      // Ensure we're on the client side before accessing sessionStorage
      if (typeof window !== 'undefined' && window.sessionStorage) {
        sessionStorage.setItem(sessionKey, JSON.stringify(bookingData));
      }
      
      // Redirect to payment page with session key
      router.push(`/payment?session=${sessionKey}&amount=${bookingData.total_amount}`);
    } catch (e: any) {
      console.error('Error storing booking data:', e);
      toast({ title: 'Error', description: `Failed to store booking data: ${e.message || 'Unknown error'}` });
    } finally {
      setSubmitting(false);
    }
  };

  const isAddressSaved = () => {
    return addresses.some(a =>
      a.street === address.street &&
      a.city === address.city &&
      a.zip === address.zip &&
      a.flat === address.flat
    );
  };

  // ✅ FINAL RETURN BLOCK (previously was blocked by an extra closing `}` and `)`)
  return (
    <div className="flex flex-col min-h-screen w-full bg-[#f9fafb]">
      <div className="flex-1 flex w-full">
        <div className="w-full h-full grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 p-8">
          {/* Main Form */}
          <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Book Your Service</h2>
          <p className="text-muted-foreground">
            {device.brand} {device.model} - {service.name}
          </p>
        </div>
              <Button variant="ghost" onClick={onBack} type="button">
          ← Back
        </Button>
      </div>
          <Card>
            <CardHeader>
              <CardTitle>Service Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="description">Describe the issue (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Tell us more about the problem..."
                  value={issueDescription}
                  onChange={(e) => setIssueDescription(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
            <Card>
              <CardHeader>
                <CardTitle>Send booking details to</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Input
                    type="tel"
                    placeholder="Enter your phone number"
                    value={phone}
                    onChange={e => handlePhoneChange(e.target.value)}
                    readOnly={!editingPhone}
                    className={editingPhone ? '' : 'bg-gray-100 cursor-not-allowed'}
                  />
                  {editingPhone ? (
                    <Button type="button" size="sm" onClick={() => setEditingPhone(false)}>
                      Save
                    </Button>
                  ) : (
                    <Button type="button" size="sm" variant="outline" onClick={() => setEditingPhone(true)}>
                      Edit
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Service Mode</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup
                  value={serviceMode}
                  onValueChange={val => setServiceMode(val as 'doorstep' | 'instore')}
                  className="flex flex-row gap-8"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="doorstep" id="doorstep" disabled={!availableServiceModes.includes('doorstep')} />
                    <Label htmlFor="doorstep">Doorstep Service</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="instore" id="instore" disabled={!availableServiceModes.includes('instore')} />
                    <Label htmlFor="instore">Visit Store</Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>
            {serviceMode === 'doorstep' && (
              <Card>
                <CardHeader>
                <CardTitle>Address</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 ">
                <Button type="button" variant="outline" className="mr-2" onClick={() => setLocationModalOpen(true)}>
                  <MapPin className="h-4 w-4 mr-2" /> Select Location
                </Button>
                <Dialog open={locationModalOpen} onOpenChange={setLocationModalOpen}>
                  <DialogContent className="max-w-md w-full p-0 rounded-lg overflow-hidden">
                    <LocationSelector onClose={() => setLocationModalOpen(false)} onSelect={(item: any) => {
                      const isReverseGeocode = !!item.osm_id;
                      const addressObj = item.address || {};
                      const lat = parseFloat(item.lat || (item.latlng && item.latlng.lat) || (item.geometry && item.geometry.lat) || 0);
                      const lon = parseFloat(item.lon || (item.latlng && item.latlng.lng) || (item.geometry && item.geometry.lng) || 0);
                      setLocation({
                        address: item.display_name || '',
                        city: addressObj.city || addressObj.town || addressObj.village || addressObj.hamlet || '',
                        state: addressObj.state || '',
                        zip: addressObj.postcode || '',
                        coordinates: [lat, lon]
                      });
                      setAddress(prev => ({
                        ...prev,
                        street: addressObj.road || addressObj.pedestrian || addressObj.neighbourhood || addressObj.suburb || '',
                        city: addressObj.city || addressObj.town || addressObj.village || addressObj.hamlet || '',
                        state: addressObj.state || '',
                        zip: addressObj.postcode || '',
                        coordinates: [lat, lon]
                      }));
                      setSelectedAddressId(null);
                      setLocationModalOpen(false);
                    }} />
                  </DialogContent>
                </Dialog>
                {addresses.length > 0 && (
                  <div className="mb-2">
                    <Label>Select Address</Label>
                    <select
                      className="w-full border rounded p-2"
                      value={selectedAddressId || ''}
                      onChange={e => {
                        setSelectedAddressId(e.target.value);
                        const selected = addresses.find(a => a.id === e.target.value);
                        if (selected) {
                          setAddress({
                            zip: selected.zip || '',
                            flat: selected.flat || '',
                            street: selected.street || '',
                            landmark: selected.landmark || '',
                            city: selected.city || '',
                            alternate: selected.alternate || '',
                            label: selected.label || 'Home',
                            is_default: selected.is_default || false
                          });
                        }
                      }}
                    >
                      {addresses.map(addr => (
                        <option key={addr.id} value={addr.id}>
                          {addr.flat}, {addr.street}, {addr.city} ({addr.label})
                          {addr.isDefault ? ' [Default]' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                  <Input required placeholder="Enter Pincode*" name="pincode" value={address.zip || ''} onChange={e => setAddress({ ...address, zip: e.target.value })} />
                  <Input required placeholder="Flat no./H no./Office*" name="flat" value={address.flat || ''} onChange={e => setAddress({ ...address, flat: e.target.value })} />
                  <Input required placeholder="Locality/Area/Street" name="street" value={address.street || ''} onChange={e => setAddress({ ...address, street: e.target.value })} />
                  <Input placeholder="Landmark (optional)" name="landmark" value={address.landmark || ''} onChange={e => setAddress({ ...address, landmark: e.target.value })} />
                  <Input required placeholder="City" name="city" value={address.city || ''} onChange={e => setAddress({ ...address, city: e.target.value })} />
                  <Input placeholder="Alternate number (optional)" name="alternate" value={address.alternate || ''} onChange={e => setAddress({ ...address, alternate: e.target.value })} />
                </div>
              </CardContent>
            </Card>
            )}
            {serviceMode === 'instore' && storeAddress && (
              storeLocationLoading ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Store Location</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-center py-8">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                        <p className="text-sm text-muted-foreground">Loading store location...</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : storeLocation ? (
                <StoreMap
                  storeLocation={{
                    lat: storeLocation.lat,
                    lng: storeLocation.lng,
                    address: storeLocation.address,
                    businessName: storeAddress.businessName || 'Store',
                    phone: storeAddress.phone,
                    hours: storeAddress.hours
                  }}
                  customerLocation={customerLocation?.coordinates ? {
                    lat: customerLocation.coordinates[0],
                    lng: customerLocation.coordinates[1]
                  } : null}
                  showDirections={true}
                />
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Store Address</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="text-gray-700">
                      <div>{storeAddress.flat || ''} {storeAddress.street || ''}</div>
                      <div>{storeAddress.city || ''} {storeAddress.state || ''} {storeAddress.zip || ''}</div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Unable to load map for this location
                    </p>
                  </CardContent>
                </Card>
              )
            )}
          <Card>
            <CardHeader>
              <CardTitle>Select Date & Time</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Preferred Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              {date && (
                <div>
                  <Label>Available Time Slots</Label>
                  {slotsLoading ? (
                    <div>Loading slots...</div>
                  ) : availableSlots.length === 0 ? (
                    <div className="text-muted-foreground">No slots available for this date.</div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {availableSlots.map((slot) => (
                        <Button
                          key={slot}
                          variant={timeSlot === slot ? "default" : "outline"}
                          size="sm"
                          type="button"
                          onClick={() => setTimeSlot(slot)}
                        >
                          {slot}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
            <Dialog open={showAddressDialog || !!editingAddress} onOpenChange={v => { setShowAddressDialog(v); if (!v) setEditingAddress(null); }}>
              <DialogContent className="max-w-lg w-full">
                <DialogHeader>
                  <DialogTitle>{editingAddress ? 'Edit Address' : 'Add New Address'}</DialogTitle>
                </DialogHeader>
                <form className="space-y-4" onSubmit={e => { e.preventDefault(); handleAddOrEditAddress(address, editingAddress?.$id); }}>
                  <Input required placeholder="Enter Pincode*" name="pincode" value={address.zip || ''} onChange={(e) => setAddress({ ...address, zip: e.target.value })} />
                  <Input required placeholder="Flat no./H no./Office*" name="flat" value={address.flat || ''} onChange={(e) => setAddress({ ...address, flat: e.target.value })} />
                  <Input required placeholder="Locality/Area/Street" name="street" value={address.street || ''} onChange={(e) => setAddress({ ...address, street: e.target.value })} />
                  <Input placeholder="Landmark (optional)" name="landmark" value={address.landmark || ''} onChange={(e) => setAddress({ ...address, landmark: e.target.value })} />
                  <Input required placeholder="City" name="city" value={address.city || ''} onChange={(e) => setAddress({ ...address, city: e.target.value })} />
                  <Input placeholder="Alternate number (optional)" name="alternate" value={address.alternate || ''} onChange={(e) => setAddress({ ...address, alternate: e.target.value })} />
                  <div className="flex gap-4 items-center">
                    <Label>Save As</Label>
                    <RadioGroup defaultValue="Home" name="label" className="flex flex-row gap-4">
                      <RadioGroupItem value="Home" id="home" /> <Label htmlFor="home">Home</Label>
                      <RadioGroupItem value="Office" id="office" /> <Label htmlFor="office">Office</Label>
                      <RadioGroupItem value="Other" id="other" /> <Label htmlFor="other">Other</Label>
              </RadioGroup>
                  </div>
                  <Button type="submit" className="w-full mt-4">Continue</Button>
                </form>
              </DialogContent>
            </Dialog>
            <Button className="w-full mt-6" type="submit" disabled={!date || !timeSlot || !phone || (serviceMode === 'doorstep' && !address.street) || submitting}>
              {submitting ? 'Processing...' : 'Continue to Payment'}
            </Button>
          </form>
        <div className="space-y-6">
          <Card className="shadow-none border-2 border-primary/10">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">Booking Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-gray-700">
                  <span className="font-medium w-32">Device</span>
                  <span className="ml-auto font-semibold">{device.brand} {device.model}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <span className="font-medium w-32">Service</span>
                  <span className="ml-auto font-semibold">
                    {issues && issues.length > 1
                      ? issues.map(s => s.name).join(', ')
                      : (issues && issues.length === 1 ? issues[0].name : service.name)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <span className="font-medium w-32">Service Mode</span>
                  <span className="ml-auto font-semibold capitalize">{serviceMode === 'doorstep' ? 'Doorstep Service' : 'Visit Store'}</span>
                </div>
                {serviceMode === 'instore' && storeAddress && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <span className="font-medium w-32">Store Address</span>
                    <span className="ml-auto font-semibold">
                      {storeAddress.flat || ''} {storeAddress.street || ''}, {storeAddress.city || ''} {storeAddress.state || ''} {storeAddress.zip || ''}
                    </span>
                  </div>
                )}
                  {/* Only show Part Quality and Warranty if Screen Replacement is selected */}
                  {issues && issues.some(s => s.name.toLowerCase().includes('screen replacement')) && (
                    <>
                <div className="flex items-center gap-2 text-gray-700">
                  <span className="font-medium w-32">Part Quality</span>
                        <span className="ml-auto font-semibold capitalize">
                          {partQuality.tier === 'oem' ? 'OEM' : 'High Quality'}
                        </span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <span className="font-medium w-32">Warranty (Provider)</span>
                  <span className="ml-auto font-semibold">
                          {issues.filter(s => s.name.toLowerCase().includes('screen replacement')).map((s, idx) => {
                            // Find the matching provider service to get the actual warranty
                            let warrantyText = `${Math.floor((s.part_qualities?.find(q => q.tier === partQuality.tier)?.warranty_days || partQuality.warranty_days) / 30)} months`;
                            
                            if (typeof providerServices !== 'undefined' && Array.isArray(providerServices)) {
                              const normalizedPartType = partQuality.tier === 'oem' ? 'OEM' : 'High Quality';
                              
                              // Try to find exact match
                              let match = providerServices.find(
                                so => so.issue === s.name && so.partType && so.partType === normalizedPartType
                              );
                              
                              // If no exact match, try base issue name
                              if (!match && (s.name.includes(' - ') || s.name.includes(' – '))) {
                                const baseIssueName = s.name.includes(' - ') ? s.name.split(' - ')[0] : s.name.split(' – ')[0];
                                console.log('🔍 Trying base issue name for warranty:', baseIssueName, 'for service:', s.name);
                                match = providerServices.find(
                                  so => so.issue === baseIssueName && so.partType && so.partType === normalizedPartType
                                );
                                if (!match) {
                                  match = providerServices.find(so => so.issue === baseIssueName);
                                }
                              }
                              
                              // Use provider's warranty if available
                              if (match && match.warranty) {
                                warrantyText = match.warranty;
                                console.log('✅ Using provider warranty:', match.warranty, 'for service:', s.name, 'match details:', {
                                  issue: match.issue,
                                  price: match.price,
                                  partType: match.partType,
                                  warranty: match.warranty
                                });
                              } else {
                                console.log('❌ No provider warranty found for service:', s.name, 'match:', match, 'available services:', providerServices.map(ps => ({
                                  issue: ps.issue,
                                  price: ps.price,
                                  partType: ps.partType,
                                  warranty: ps.warranty
                                })), 'baseIssueName:', s.name.includes(' - ') ? s.name.split(' - ')[0] : (s.name.includes(' – ') ? s.name.split(' – ')[0] : null));
                              }
                            }
                            
                            return (
                              <span key={s.id} className="block">
                                {s.name} – {warrantyText}
                              </span>
                            );
                          })}
                  </span>
                </div>
                    </>
                  )}
              </div>
              <div className="pt-2">
                <div className="flex items-center gap-2 text-gray-700 mb-1">
                  <span className="font-medium w-32">Issue-wise Pricing</span>
                </div>
                <div className="ml-10 space-y-1">
                  {issues && issues.length > 0
                    ? issues.map((s, idx) => {
                        // Use providerServices price if available, else fallback
                        let price = Math.round((s.base_price || 0) * (partQuality.price_multiplier || 1));
                        
                        if (typeof providerServices !== 'undefined' && Array.isArray(providerServices)) {
                          
                          // Normalize part quality tier to match database format
                          const normalizedPartType = partQuality.tier === 'oem' ? 'OEM' : 'High Quality';
                          
                          // First try to find exact match with partType using issue name
                          let match = providerServices.find(
                            so => so.issue === s.name && so.partType && so.partType === normalizedPartType
                          );
                          
                          // If no exact match, try to find any service for this issue (fallback)
                          if (!match) {
                            match = providerServices.find(so => so.issue === s.name);
                          }
                          
                          // If still no match, try to match by base issue name (for screen replacement)
                          if (!match && (s.name.includes(' - ') || s.name.includes(' – '))) {
                            const baseIssueName = s.name.includes(' - ') ? s.name.split(' - ')[0] : s.name.split(' – ')[0];
                            match = providerServices.find(
                              so => so.issue === baseIssueName && so.partType && so.partType === normalizedPartType
                            );
                            if (!match) {
                              match = providerServices.find(so => so.issue === baseIssueName);
                            }
                          }
                          
                          console.log('🔍 BookingForm pricing match:', {
                            serviceName: s.name,
                            serviceId: s.id,
                            providerServicesCount: providerServices.length,
                            providerServices: providerServices.map(ps => ({ issue: ps.issue, price: ps.price, partType: ps.partType, warranty: ps.warranty })),
                            match: match,
                            finalPrice: match ? match.price : price,
                            basePrice: s.base_price,
                            partQualityMultiplier: partQuality.price_multiplier,
                            normalizedPartType: normalizedPartType,
                            partQualityTier: partQuality.tier,
                            baseIssueName: s.name.includes(' - ') ? s.name.split(' - ')[0] : (s.name.includes(' – ') ? s.name.split(' – ')[0] : null)
                          });
                          
                          if (match && match.price) {
                            price = match.price;
                            console.log('✅ Using provider price:', price);
                          } else {
                            console.log('❌ No provider match found, using fallback price:', price);
                          }
                        } else {
                          console.log('❌ ProviderServices is undefined or not an array:', providerServices);
                        }
                        
                        return (
                          <div key={s.id} className="flex justify-between text-sm">
                              <span>{s.name}</span>
                            <span className="font-semibold">₹{price.toLocaleString()}</span>
                          </div>
                        );
                      })
                    : (
                        <div className="flex justify-between text-sm">
                            <span>{service.name}</span>
                          <span className="font-semibold">₹{totalAmount.toLocaleString()}</span>
                        </div>
                      )}
                </div>
              </div>
              <div className="border-t pt-4 flex items-center gap-2">
                <span className="font-medium w-32">Total</span>
                  <span className="ml-auto text-lg font-bold text-primary">₹{(
                  issues && issues.length > 0
                    ? issues.reduce((sum, s) => {
                        let price = Math.round((s.base_price || 0) * (partQuality.price_multiplier || 1));
                        if (typeof providerServices !== 'undefined' && Array.isArray(providerServices)) {
                          // Normalize part quality tier to match database format
                          const normalizedPartType = partQuality.tier === 'oem' ? 'OEM' : 'High Quality';
                          
                          // First try to find exact match with partType using issue name
                          let match = providerServices.find(
                            so => so.issue === s.name && so.partType && so.partType === normalizedPartType
                          );
                          
                          // If no exact match, try to find any service for this issue (fallback)
                          if (!match) {
                            match = providerServices.find(so => so.issue === s.name);
                          }
                          
                          // If still no match, try to match by base issue name (for screen replacement)
                          if (!match && (s.name.includes(' - ') || s.name.includes(' – '))) {
                            const baseIssueName = s.name.includes(' - ') ? s.name.split(' - ')[0] : s.name.split(' – ')[0];
                            match = providerServices.find(
                              so => so.issue === baseIssueName && so.partType && so.partType === normalizedPartType
                            );
                            if (!match) {
                              match = providerServices.find(so => so.issue === baseIssueName);
                            }
                          }
                          
                          if (match && match.price) price = match.price;
                        }
                        return sum + price;
                      }, 0)
                    : totalAmount
                  ).toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
