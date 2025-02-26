// src/app/(app)/search/page.tsx

"use client";

import React, { useState, useEffect, useCallback } from "react";
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
  const [retryCount, setRetryCount] = useState(0);

  // Listen for station selection events from NavigationDock
  useEffect(() => {
    const handleStationSelected = (event: CustomEvent<Station>) => {
      setSelectedStation(event.detail);
      // Reset states when a new station is selected
      setRetryCount(0);
      setError(null);
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
   * with improved error handling and retry logic
   */
  const fetchArrivals = useCallback(async (stationId: string) => {
    // If we've failed multiple times in a row, add a delay
    const delayMs = retryCount > 2 ? 2000 : 0;
    
    try {
      setLoading(true);
      // Don't clear error immediately to avoid UI flash if we're retrying
      if (retryCount === 0) setError(null);
      
      // Add delay if we've had multiple failures
      if (delayMs > 0) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
      
      // Check if we have recently updated data (within last 30 seconds)
      const isRecent = lastUpdated && (Date.now() - lastUpdated.getTime() < 30000);
      
      // Set custom headers to help the API determine caching strategy
      const resp = await fetch(`/api/cta/arrivals/station?stations=${stationId}`, {
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache', 
          // Don't force a refresh if we just got data recently
          'x-force-refresh': isRecent ? 'false' : 'true',
          // We don't want background refreshes with manual refresh model
          'x-allow-background': 'false'
        }
      });
      
      clearTimeout(timeoutId);
      console.log('Arrivals API Response Status:', resp.status);
      
      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status} – ${resp.statusText || 'Network error'}`);
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
      setRetryCount(0); // Reset retry count on success
      setError(null);
    } catch (err: any) {
      console.error('Error fetching arrivals:', err);
      
      // Format a more user-friendly error message
      let errorMessage = "Error fetching arrivals";
      
      if (err.name === 'AbortError') {
        errorMessage = "Request timed out - please try again";
      } else if (err.message?.includes('504')) {
        errorMessage = "The server is taking too long to respond - please try again";
      } else if (err.message?.includes('fetch')) {
        errorMessage = "Network error - please check your connection";
      }
      
      setError(`${errorMessage}. ${retryCount > 0 ? `Retry attempt ${retryCount}` : ''}`);
      setRetryCount(prev => prev + 1);
      
      // With manual refresh, we don't need to manage auto-refresh state
    } finally {
      setLoading(false);
    }
  }, [retryCount]);

  // Re-fetch arrivals for the selected station on demand
  function handleRefresh() {
    if (selectedStation?.stationId) {
      // Reset error state and retry count when manually refreshing
      setRetryCount(0);
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
  }, [selectedStation, fetchArrivals]);

  // No auto-refresh - we're using manual refresh only
  // We removed the auto-refresh interval to simplify the UX

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