import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Place {
  id: number;
  name: string;
  location_type: 'fixed' | 'mobile';
  city?: string;
  service_areas?: string[];
}

interface PlaceContextType {
  selectedPlace: Place | null;
  selectedPlaceId: number | null;
  setSelectedPlace: (place: Place | null) => void;
  setSelectedPlaceId: (id: number | null) => void;
  places: Place[];
  setPlaces: (places: Place[]) => void;
}

const PlaceContext = createContext<PlaceContextType | undefined>(undefined);

export const PlaceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [selectedPlaceId, setSelectedPlaceId] = useState<number | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);

  // Auto-select first place when places are loaded
  useEffect(() => {
    if (places.length > 0 && !selectedPlaceId) {
      setSelectedPlaceId(places[0].id);
      setSelectedPlace(places[0]);
    }
  }, [places, selectedPlaceId]);

  // Update selected place when selectedPlaceId changes
  useEffect(() => {
    if (selectedPlaceId) {
      const place = places.find(p => p.id === selectedPlaceId);
      setSelectedPlace(place || null);
    }
  }, [selectedPlaceId, places]);

  const handleSetSelectedPlace = (place: Place | null) => {
    setSelectedPlace(place);
    setSelectedPlaceId(place?.id || null);
  };

  const handleSetSelectedPlaceId = (id: number | null) => {
    setSelectedPlaceId(id);
    const place = places.find(p => p.id === id);
    setSelectedPlace(place || null);
  };

  return (
    <PlaceContext.Provider
      value={{
        selectedPlace,
        selectedPlaceId,
        setSelectedPlace: handleSetSelectedPlace,
        setSelectedPlaceId: handleSetSelectedPlaceId,
        places,
        setPlaces,
      }}
    >
      {children}
    </PlaceContext.Provider>
  );
};

export const usePlaceContext = () => {
  const context = useContext(PlaceContext);
  if (context === undefined) {
    throw new Error('usePlaceContext must be used within a PlaceProvider');
  }
  return context;
};

