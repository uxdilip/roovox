import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import LocationSelector from '@/components/LocationSelector';
import { MapPin } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { upsertBusinessSetup } from '@/lib/appwrite-services';
import { databases, DATABASE_ID } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { useToast } from '@/hooks/use-toast';

const WEEKDAYS = [
  { key: 'sun', label: 'Sun' },
  { key: 'mon', label: 'Mon' },
  { key: 'tue', label: 'Tue' },
  { key: 'wed', label: 'Wed' },
  { key: 'thu', label: 'Thu' },
  { key: 'fri', label: 'Fri' },
  { key: 'sat', label: 'Sat' },
];

interface ServiceSetupStepProps {
  data: any;
  setData: (d: any) => void;
  onNext: () => void;
  onPrev: () => void;
}

const defaultAvailability = WEEKDAYS.reduce((acc, day) => {
  acc[day.key] = { available: true, start: '10:00', end: '19:00' };
  return acc;
}, {} as Record<string, { available: boolean; start: string; end: string }>);

const LocationAvailabilityStep: React.FC<ServiceSetupStepProps> = ({ data, setData, onNext, onPrev }) => {
  const [showLocationSelector, setShowLocationSelector] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<any>(data.location || null);
  const [availability, setAvailability] = useState<Record<string, { available: boolean; start: string; end: string }>>(
    data.availability || defaultAvailability
  );
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setData({
      ...data,
      location: selectedLocation,
      availability,
    });
    // eslint-disable-next-line
  }, [selectedLocation, availability]);

  const isValid = !!selectedLocation;

  // Backend save logic
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || !user) return;
    setLoading(true);
    try {
      // Fetch latest onboarding_data from DB
      let onboarding_data = {};
      const res = await databases.listDocuments(
        DATABASE_ID,
        'business_setup',
        [Query.equal('user_id', user.id), Query.limit(1)]
      );
      if (res.documents.length > 0) {
        try {
          onboarding_data = JSON.parse(res.documents[0].onboarding_data || '{}');
        } catch {
          onboarding_data = {};
        }
      }
      onboarding_data = {
        ...onboarding_data,
        serviceSetup: {
          location: selectedLocation,
          availability,
        },
      };
      await upsertBusinessSetup({
        user_id: user.id,
        onboarding_data,
      });
      // AUTOMATION: Sync working_hours to providers collection
      try {
        await databases.updateDocument(
          DATABASE_ID,
          'providers',
          user.id,
          { working_hours: JSON.stringify(Object.entries(availability).map(([key, val]) => ({
            day: key.charAt(0).toUpperCase() + key.slice(1),
            ...val
          })))}
        );
      } catch (err) {
        console.error('❌ Failed to sync working_hours to providers:', err);
      }
      setData({ ...data, onboarding_data });
      toast({ title: 'Location & Availability saved', description: 'Your location and availability have been saved successfully.' });
      onNext();
    } catch (err: any) {
      toast({ title: 'Error', description: 'Failed to save location & availability. Please try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      <div className="bg-gray-50 p-6 rounded-xl shadow-sm flex flex-col gap-6">
        <div>
          <label className="block font-semibold mb-2">Service Area</label>
          <Button
            type="button"
            variant="secondary"
            className="w-full flex items-center gap-2 border border-gray-300 hover:border-primary hover:bg-primary/10 transition mb-2"
            onClick={() => setShowLocationSelector(true)}
          >
            <MapPin className="h-5 w-5 text-primary" />
            {selectedLocation ? 'Change Location' : 'Select Location'}
          </Button>
          {selectedLocation && (
            <div className="text-sm text-gray-700 bg-white rounded p-3 border mt-2">
              <div><b>Address:</b> {selectedLocation.address}</div>
              <div><b>City:</b> {selectedLocation.city}</div>
              <div><b>State:</b> {selectedLocation.state}</div>
              <div><b>Zip:</b> {selectedLocation.zip}</div>
              <div><b>Coordinates:</b> {selectedLocation.coordinates?.join(', ')}</div>
            </div>
          )}
          {showLocationSelector && (
            <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
              <LocationSelector
                onClose={() => setShowLocationSelector(false)}
                onSelect={item => {
                  setSelectedLocation({
                    address: item.display_name,
                    city: item.address?.city || item.address?.town || item.address?.village || '',
                    state: item.address?.state || '',
                    zip: item.address?.postcode || '',
                    coordinates: [parseFloat(item.lat), parseFloat(item.lon)]
                  });
                  setShowLocationSelector(false);
                }}
              />
            </div>
          )}
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-4">Availability Calendar</h2>
          <div className="bg-gray-50 p-6 rounded-xl shadow-sm">
            <div className="grid grid-cols-1 gap-6">
              {WEEKDAYS.map(day => (
                <div key={day.key} className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex items-center gap-4 min-w-[120px]">
                    <Label className="w-16 font-medium">{day.label}</Label>
                    <Switch
                      checked={!!availability[day.key]?.available}
                      onCheckedChange={checked => {
                        setAvailability(prev => ({
                          ...prev,
                          [day.key]: {
                            ...((prev && prev[day.key]) || { available: false, start: '10:00', end: '19:00' }),
                            available: checked
                          }
                        }));
                      }}
                      id={`switch-${day.key}`}
                    />
                    <span className="text-sm">Available</span>
                  </div>
                  {availability[day.key]?.available && (
                    <div className="flex items-center gap-2">
                      <Input
                        type="time"
                        value={availability[day.key]?.start ?? '10:00'}
                        onChange={e => {
                          setAvailability(prev => ({
                            ...prev,
                            [day.key]: {
                              ...((prev && prev[day.key]) || { available: false, start: '10:00', end: '19:00' }),
                              start: e.target.value
                            }
                          }));
                        }}
                        className="w-24"
                      />
                      <span>-</span>
                      <Input
                        type="time"
                        value={availability[day.key]?.end ?? '19:00'}
                        onChange={e => {
                          setAvailability(prev => ({
                            ...prev,
                            [day.key]: {
                              ...((prev && prev[day.key]) || { available: false, start: '10:00', end: '19:00' }),
                              end: e.target.value
                            }
                          }));
                        }}
                        className="w-24"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto pb-24">
      </div>
      <div className="sticky bottom-0 left-0 right-0 bg-white pt-4 pb-2 flex justify-between border-t z-10">
        <Button type="button" variant="outline" onClick={onPrev}>Previous</Button>
        <Button type="submit" disabled={!isValid || loading} className="ml-2">
          {loading ? 'Saving...' : 'Save & Continue'}
        </Button>
      </div>
    </form>
  );
};

export default LocationAvailabilityStep; 