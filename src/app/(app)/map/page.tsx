"use client";

import React, { useState } from 'react';
import { useStations } from '@/lib/hooks/useStations';
import MapComponent from '@/components/map/MapComponent';
import ArrivalBottomSheet from '@/components/map/ArrivalBottomSheet';
import type { Station } from '@/lib/types/cta';

export default function MapPage() {
  const { data: stations = [], isLoading: stationsLoading } = useStations();
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [showBottomSheet, setShowBottomSheet] = useState(false);

  // Handler for when a station marker is clicked
  const handleStationSelect = (station: Station) => {
    setSelectedStation(station);
    setShowBottomSheet(true);
  };

  // Handler to close the bottom sheet
  const handleCloseBottomSheet = () => {
    setShowBottomSheet(false);
  };

  return (
    // Use flex-1 + relative + min-h-0 so this container can actually fill
    // the height of its parent layout. That way, the map can appear.
    <div className="flex-1 relative min-h-0 w-full">
      {stationsLoading ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-muted-foreground">Loading map...</p>
        </div>
      ) : (
        <>
          <MapComponent 
            stations={stations} 
            onStationSelect={handleStationSelect} 
          />
          
          <ArrivalBottomSheet 
            isOpen={showBottomSheet} 
            station={selectedStation} 
            onClose={handleCloseBottomSheet} 
          />
        </>
      )}
    </div>
  );
}