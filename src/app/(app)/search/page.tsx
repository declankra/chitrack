"use client";

import React, { useState, useEffect } from "react";
import { useStations } from "@/lib/hooks/useStations";
import type { Station } from "@/lib/types/cta";
import ArrivalBoard from "./_components/ArrivalBoard";


export default function SearchPage() {
  const { data: stations = [] } = useStations();
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);

  // arrivals data from CTA
  const [arrivals, setArrivals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Listen for station selection events from NavigationDock
  useEffect(() => {
    const handleStationSelected = (event: CustomEvent<Station>) => {
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

  /**
   * Fetch arrivals from /api/cta/arrivals/station?stations=<stationId>
   */
  async function fetchArrivals(stationId: string) {
    try {
      setLoading(true);
      setError(null);
      const resp = await fetch(`/api/cta/arrivals/station?stations=${stationId}`);
      console.log('Arrivals API Response Status:', resp.status);
      
      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status} – ${resp.statusText}`);
      }
      
      const data = await resp.json();
      console.log('Arrivals API Response:', {
        dataExists: !!data,
        stationCount: data.length,
        firstStation: data[0] ? {
          stationId: data[0].stationId,
          stopCount: data[0].stops.length,
          sampleArrival: data[0].stops[0]?.arrivals[0]
        } : null
      });
      
      setArrivals(data);
      setLastUpdated(new Date());
    } catch (err: any) {
      console.error('Error fetching arrivals:', err);
      setError(err.message ?? "Error fetching arrivals");
    } finally {
      setLoading(false);
    }
  }

  // Re-fetch arrivals for the selected station on demand
  function handleRefresh() {
    if (selectedStation?.stationId) {
      fetchArrivals(selectedStation.stationId);
    }
  }

  // Whenever user picks a station, fetch arrivals immediately
  useEffect(() => {
    if (selectedStation?.stationId) {
      fetchArrivals(selectedStation.stationId);
    } else {
      setArrivals([]);
      setError(null);
      setLastUpdated(null);
    }
  }, [selectedStation]);

  return (
    <div className="h-full flex flex-col space-y-4">
      {!selectedStation && (
        <div className="mt-12 text-center space-y-2">
          <h1 className="text-2xl font-bold">Find Your Station</h1>
          <p className="text-sm text-muted-foreground">
            Type to search for a station below
          </p>
        </div>
      )}

      {/* Selected Station arrivals */}
      {selectedStation && (
        <ArrivalBoard
          arrivals={arrivals}
          loading={loading}
          error={error}
          lastUpdated={lastUpdated}
          onRefresh={handleRefresh}
          stationName={selectedStation.stationName}
        />
      )}
    </div>
  );
}