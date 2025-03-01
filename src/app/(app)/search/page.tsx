// src/app/(app)/search/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useStations } from "@/lib/hooks/useStations";
import type { Station } from "@/lib/types/cta";
import ArrivalBoard from "../../../components/search/ArrivalBoard";
import { Search, RefreshCw } from "lucide-react";

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

  /**
   * Fetch arrivals from /api/cta/arrivals/station?stations=<stationId>
   * with improved error handling and retry logic
   */
  const fetchArrivals = useCallback(async (stationId: string) => {
    // Match API's MAX_RETRIES=2 setting
    const MAX_CLIENT_RETRIES = 2;
    
    // If we've exceeded retries, don't attempt again automatically
    if (retryCount >= MAX_CLIENT_RETRIES) {
      return;
    }
    
    // Add delay for retries
    const delayMs = retryCount > 0 ? 2000 : 0;
    
    try {
      setLoading(true);
      // Don't clear error immediately to avoid UI flash if we're retrying
      if (retryCount === 0) setError(null);
      
      // Add delay if retrying
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
      
      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status} – ${resp.statusText || 'Network error'}`);
      }
      
      const data = await resp.json();
      
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
      
      const newRetryCount = retryCount + 1;
      setError(`${errorMessage}${newRetryCount <= MAX_CLIENT_RETRIES ? ` (Retry ${newRetryCount}/${MAX_CLIENT_RETRIES})` : ''}`);
      setRetryCount(newRetryCount);
    } finally {
      setLoading(false);
    }
  }, [retryCount, lastUpdated]);

  // Re-fetch arrivals for the selected station on demand
  function handleRefresh() {
    if (selectedStation?.stationId) {
      // Reset error state and retry count when manually refreshing
      setRetryCount(0);
      fetchArrivals(selectedStation.stationId);
    }
  }

  // Whenever user picks a station, fetch arrivals immediately - only once
  useEffect(() => {
    if (selectedStation?.stationId) {
      // Reset states when a new station is selected
      setArrivals([]);
      setError(null);
      setRetryCount(0);
      setLastUpdated(null);
      
      // Then fetch data for the new station
      fetchArrivals(selectedStation.stationId);
    } else {
      setArrivals([]);
      setError(null);
      setLastUpdated(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStation?.stationId]); // Only depend on the ID, not the whole object or fetchArrivals

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