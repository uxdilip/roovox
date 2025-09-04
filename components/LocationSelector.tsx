import React, { useState } from 'react';
import { useLocation } from '@/contexts/LocationContext';
import { useAuth } from '@/contexts/AuthContext';
import { updateUserDocument } from '@/lib/appwrite-services';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MapPin, X } from 'lucide-react';
import { databases, DATABASE_ID } from '@/lib/appwrite';
import { Query } from 'appwrite';

async function updateUserLocationByUserId(userId: string, locationData: any) {
  const res = await databases.listDocuments(
    DATABASE_ID,
    'User',
    [Query.equal('user_id', userId), Query.limit(1)]
  );
  if (res.documents.length > 0) {
    const docId = res.documents[0].$id;
    await databases.updateDocument(
      DATABASE_ID,
      'User',
      docId,
      {
        address_city: locationData.city || '',
        address_state: locationData.state || '',
        address_zip: locationData.zip || '',
        address_lat: locationData.coordinates?.[0] || 0,
        address_lng: locationData.coordinates?.[1] || 0,
        updated_at: new Date().toISOString(),
      }
    );
    // Fetch and log the updated document for verification
    const updatedDoc = await databases.getDocument(
      DATABASE_ID,
      'User',
      docId
    );
  }
}

interface LocationSelectorProps {
  onClose: () => void;
  onSelect?: (item: any) => void;
  onLocationUpdate?: (locationData: any) => void;
}

export default function LocationSelector({ onClose, onSelect, onLocationUpdate }: LocationSelectorProps) {
  const { setLocation } = useLocation();
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [geoLoading, setGeoLoading] = useState(false);

  // Address autocomplete using Nominatim
  const handleSearch = async (q: string) => {
    setQuery(q);
    if (q.length < 3) {
      setResults([]);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&addressdetails=1&limit=5`);
      const data = await res.json();
      setResults(data);
    } catch (e) {
      setError('Failed to fetch suggestions');
    } finally {
      setLoading(false);
    }
  };

  // Select address from autocomplete
  const handleSelect = async (item: any) => {
    const locationData = {
      address: item.display_name,
      city: item.address.city || item.address.town || item.address.village || '',
      state: item.address.state || '',
      zip: item.address.postcode || '',
      coordinates: [parseFloat(item.lat), parseFloat(item.lon)] as [number, number]
    };

    if (onSelect) {
      onSelect(item);
    } else {
      setLocation(locationData);
      
      // Save to user collection if user is logged in
      if (user) {
        try {
          await updateUserLocationByUserId(user.id, locationData);
        } catch (error) {
          console.error('❌ Error updating location in user collection:', error);
        }
      }

      // Call onLocationUpdate if provided
      if (onLocationUpdate) {
        await onLocationUpdate(locationData);
      }
      
      onClose();
    }
  };

  // Get current location using browser geolocation
  const handleGetCurrentLocation = () => {
    setGeoLoading(true);
    setError('');
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`);
        const data = await res.json();
        
        const locationData = {
          address: data.display_name,
          city: data.address.city || data.address.town || data.address.village || '',
          state: data.address.state || '',
          zip: data.address.postcode || '',
          coordinates: [latitude, longitude] as [number, number]
        };
        
        if (onSelect) {
          onSelect(data);
        } else {
          setLocation(locationData);
          
          // Save to user collection if user is logged in
          if (user) {
            try {
              await updateUserLocationByUserId(user.id, locationData);
            } catch (error) {
              console.error('❌ Error updating current location in user collection:', error);
            }
          }

          // Call onLocationUpdate if provided
          if (onLocationUpdate) {
            await onLocationUpdate(locationData);
          }
          
          onClose();
        }
      } catch (e) {
        setError('Failed to get address from location');
      } finally {
        setGeoLoading(false);
      }
    }, (err) => {
      setError('Failed to get current location');
      setGeoLoading(false);
    });
  };

  return (
    <div className="p-6 bg-white w-full max-w-md mx-auto rounded-lg relative">
      <button className="absolute right-4 top-4" onClick={onClose}><X className="h-5 w-5" /></button>
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><MapPin className="h-6 w-6 text-primary" /> Select your location</h2>
      <Input
        placeholder="Search for area, street name..."
        value={query}
        onChange={e => handleSearch(e.target.value)}
        className="mb-3"
      />
      <Button
        variant="outline"
        className="w-full mb-4 flex items-center gap-2 justify-center"
        onClick={handleGetCurrentLocation}
        disabled={geoLoading}
      >
        <MapPin className="h-5 w-5" />
        {geoLoading ? 'Locating...' : 'Get current location'}
      </Button>
      {loading && <div className="text-sm text-gray-500">Loading...</div>}
      {error && <div className="text-sm text-red-500 mb-2">{error}</div>}
      <ul className="divide-y border rounded bg-gray-50">
        {results.map((item, idx) => (
          <li key={item.place_id} className="p-2 hover:bg-blue-50 cursor-pointer" onClick={() => handleSelect(item)}>
            <div className="font-medium">{item.display_name}</div>
            <div className="text-xs text-gray-500">{item.type}</div>
          </li>
        ))}
      </ul>
    </div>
  );
} 