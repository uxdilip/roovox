"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface LocationData {
  address: string;
  city: string;
  state: string;
  zip: string;
  coordinates: [number, number];
}

interface LocationContextType {
  location: LocationData | null;
  setLocation: (location: LocationData) => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider = ({ children }: { children: React.ReactNode }) => {
  const [location, setLocationState] = useState<LocationData | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('selected_location') : null;
    if (stored) {
      try {
        setLocationState(JSON.parse(stored));
      } catch {}
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    if (location) {
      localStorage.setItem('selected_location', JSON.stringify(location));
    }
  }, [location]);

  const setLocation = (loc: LocationData) => {
    setLocationState(loc);
  };

  return (
    <LocationContext.Provider value={{ location, setLocation }}>
      {children}
    </LocationContext.Provider>
  );
};

export function useLocation() {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error('useLocation must be used within a LocationProvider');
  return ctx;
} 