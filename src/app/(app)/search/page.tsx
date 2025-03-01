// src/app/(app)/search/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useStations } from "@/lib/hooks/useStations";
import { useStationArrivals } from "@/lib/hooks/useStationArrivals";
import type { Station } from "@/lib/types/cta";
import ArrivalBoard from "@/components/search/ArrivalBoard";
import { Search } from "lucide-react";

export default function SearchPage() {
  const { data: stations = [] } = useStations();
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Use the stationArrivals hook to get arrivals data
  const {
    data: arrivalsData = [],
    isLoading: arrivalsLoading,
    error: arrivalsError,
    refetch: refetchArrivals,
    lastUpdated
  } = useStationArrivals(selectedStation?.stationId || '', {
    enabled: !!selectedStation?.stationId,
    forceRefresh: true,
  });

  // Listen for station selection events from NavigationDock
  useEffect(() => {
    const handleStationSelected = (event: CustomEvent<Station>) => {
      // Store just the station, state resets are handled in the station effect
      setSelectedStation(event.detail);
    };

    const handleSearchQueryChanged = (event: CustomEvent<string>) => {
      // This will be handled by the SearchBar component
      console.log('Search query changed:', event.detail);
    };

    window.addEventListener('stationSelected', handleStationSelected as EventListener);
    window.addEventListener('searchQueryChanged', handleSearchQueryChanged as EventListener);
    
    return () => {
      window.removeEventListener('stationSelected', handleStationSelected as EventListener);
      window.removeEventListener('searchQueryChanged', handleSearchQueryChanged as EventListener);
    };
  }, []);

  // Handle manual refresh
  const handleRefresh = () => {
    if (selectedStation?.stationId) {
      // Reset error state and retry count when manually refreshing
      setError(null);
      setRetryCount(0);
      refetchArrivals();
    }
  };

  // Handle errors from the hook
  useEffect(() => {
    if (arrivalsError) {
      const errMsg = arrivalsError instanceof Error ? arrivalsError.message : 'Error fetching arrivals';
      
      // Format a more user-friendly error message
      let errorMessage = "Error fetching arrivals";
      
      if (errMsg.includes('timeout') || errMsg.includes('abort')) {
        errorMessage = "Request timed out - please try again";
      } else if (errMsg.includes('504')) {
        errorMessage = "The server is taking too long to respond - please try again";
      } else if (errMsg.includes('fetch') || errMsg.includes('network')) {
        errorMessage = "Network error - please check your connection";
      }
      
      const MAX_CLIENT_RETRIES = 2;
      const newRetryCount = retryCount + 1;
      setError(`${errorMessage}${newRetryCount <= MAX_CLIENT_RETRIES ? ` (Retry ${newRetryCount}/${MAX_CLIENT_RETRIES})` : ''}`);
      setRetryCount(newRetryCount);
    } else {
      setError(null);
    }
  }, [arrivalsError, retryCount]);

  // Reset when changing stations
  useEffect(() => {
    if (selectedStation?.stationId) {
      setError(null);
      setRetryCount(0);
    }
  }, [selectedStation?.stationId]);

  return (
    <div className="h-full flex flex-col">
      {!selectedStation ? (
        <div className="flex flex-col items-center justify-center h-full text-center px-6">
          <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-6">
            <Search className="w-8 h-8 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Find Your Station</h1>
          <p className="text-sm text-muted-foreground max-w-xs">
            Type in the search bar below to find a station and view upcoming arrivals
          </p>
        </div>
      ) : (
        <ArrivalBoard
          arrivals={arrivalsData}
          loading={arrivalsLoading}
          error={error}
          lastUpdated={lastUpdated}
          onRefresh={handleRefresh}
          stationName={selectedStation.stationName}
        />
      )}
    </div>
  );
}