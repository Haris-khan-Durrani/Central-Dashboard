'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface LocationItem {
  id: number;
  locationId: string;
  name: string;
  keyHint: string | null;
  currency: string;
  timezone: string;
  isActive: boolean;
  lastSyncAt: string | null;
  syncStatus: string;
  syncErrorMessage: string | null;
}

interface LocationContextType {
  locations: LocationItem[];
  activeLocation: LocationItem | null;
  activeLocationId: string;
  setActiveLocationId: (id: string) => void;
  isLoadingLocations: boolean;
  isSettingsModalOpen: boolean;
  setIsSettingsModalOpen: (open: boolean) => void;
  refreshLocations: () => Promise<void>;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [activeLocationId, setActiveLocationIdState] = useState<string>('');
  const [isLoadingLocations, setIsLoadingLocations] = useState(true);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  const refreshLocations = useCallback(async () => {
    try {
      const res = await fetch('/api/locations');
      const data = await res.json();
      if (data.success && Array.isArray(data.locations)) {
        setLocations(data.locations);

        // Check if there's a location_id query param in the URL (GHL custom menu / iframe)
        if (typeof window !== 'undefined') {
          const urlParams = new URLSearchParams(window.location.search);
          const queryLoc = urlParams.get('location_id') || urlParams.get('locationId');
          if (queryLoc && data.locations.some((l: LocationItem) => l.locationId === queryLoc)) {
            setActiveLocationIdState(queryLoc);
            return;
          }
        }

        // Otherwise preserve saved location or pick first
        setActiveLocationIdState((prev) => {
          if (prev && data.locations.some((l: LocationItem) => l.locationId === prev)) {
            return prev;
          }
          const saved = typeof window !== 'undefined' ? localStorage.getItem('central_active_location_id') : null;
          if (saved && data.locations.some((l: LocationItem) => l.locationId === saved)) {
            return saved;
          }
          return data.locations[0]?.locationId || '';
        });
      }
    } catch (err) {
      console.error('Failed to load sub-accounts:', err);
    } finally {
      setIsLoadingLocations(false);
    }
  }, []);

  useEffect(() => {
    refreshLocations();
  }, [refreshLocations]);

  const setActiveLocationId = (id: string) => {
    setActiveLocationIdState(id);
    if (typeof window !== 'undefined') {
      localStorage.setItem('central_active_location_id', id);
    }
  };

  const activeLocation = locations.find((l) => l.locationId === activeLocationId) || locations[0] || null;

  return (
    <LocationContext.Provider
      value={{
        locations,
        activeLocation,
        activeLocationId: activeLocation?.locationId || activeLocationId,
        setActiveLocationId,
        isLoadingLocations,
        isSettingsModalOpen,
        setIsSettingsModalOpen,
        refreshLocations,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocationContext() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocationContext must be used within a LocationProvider');
  }
  return context;
}
