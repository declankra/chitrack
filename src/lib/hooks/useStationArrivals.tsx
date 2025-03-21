// src/lib/hooks/useStationArrivals.tsx
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useRef } from 'react';
import { useTime } from '@/lib/providers/TimeProvider';
import type { StationArrivalsResponse } from '@/lib/types/cta';

// Helper function to create an AbortController with React Native compatibility
const createAbortController = () => {
  // Make sure AbortController exists (it might not in some older React Native environments)
  if (typeof AbortController !== 'undefined') {
    return new AbortController();
  }
  
  // Fallback for environments without AbortController
  return {
    signal: { aborted: false },
    abort: () => { 
      (this as any).signal.aborted = true;
    }
  };
};

interface UseStationArrivalsOptions {
  enabled?: boolean;
  refetchInterval?: number;
  staleTime?: number;
  forceRefresh?: boolean;
  allowBackground?: boolean;
}

const defaultOptions: UseStationArrivalsOptions = {
  enabled: true,
  refetchInterval: 30000, // 30 seconds
  staleTime: 0,           // Set to 0 to avoid stale cache issue
  forceRefresh: false,    // Changed from true to avoid unnecessary force refreshes
  allowBackground: true
};

/**
 * Custom hook to fetch arrivals for a station
 * @param stationId Station ID to fetch arrivals for
 * @param options Query options
 * @returns Query result object
 */
export const useStationArrivals = (
  stationId: string,
  options: UseStationArrivalsOptions = {}
) => {
  const { currentTime, updateLastRefreshTime } = useTime();
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const mergedOptions = { ...defaultOptions, ...options };
  const queryClient = useQueryClient();
  const abortControllerRef = useRef<any>(null);
  
  // Cleanup any pending requests when unmounting
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);
  
  const query = useQuery<StationArrivalsResponse[], Error>({
    queryKey: ['stationArrivals', stationId],
    queryFn: async () => {
      // Abort any previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // Create a new abort controller for this request
      abortControllerRef.current = createAbortController();
      
      if (!stationId) {
        throw new Error('No station ID provided');
      }
      
      try {
        const fetchOptions: RequestInit = {
          headers: {
            'Cache-Control': 'no-cache',
            // Force refresh when explicitly requested by the user
            'x-force-refresh': mergedOptions.forceRefresh ? 'true' : 'false',
            // Enable background refresh for automatic updates
            'x-allow-background': mergedOptions.allowBackground ? 'true' : 'false'
          }
        };
        
        // Only add signal if AbortController is supported
        if (abortControllerRef.current.signal) {
          fetchOptions.signal = abortControllerRef.current.signal;
        }
        
        // Set custom headers to help the API determine caching strategy
        const response = await fetch(`/api/cta/arrivals/station?stations=${stationId}`, fetchOptions);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status} – ${response.statusText || 'Network error'}`);
        }
        
        // Check cache status from response headers for debugging
        const cacheStatus = response.headers.get('X-Cache');
        const cacheAge = response.headers.get('X-Cache-Age');
        const isFresh = response.headers.get('X-Cache-Fresh') === 'true';
        
        console.log(`Station ${stationId} data: Cache ${cacheStatus}, Age: ${cacheAge}s, Fresh: ${isFresh}`);
        
        // Update last refresh time in TimeProvider
        updateLastRefreshTime();
        
        // Set last updated time
        const newUpdateTime = new Date();
        setLastUpdated(newUpdateTime);
        
        const data = await response.json();
        return data as StationArrivalsResponse[];
      } catch (error) {
        // Don't log aborted request errors - they're expected
        if (error instanceof DOMException && error.name === 'AbortError') {
          console.log(`Request for station ${stationId} was aborted`);
          throw new Error('Request aborted');
        }
        
        console.error(`Error fetching arrivals for station ${stationId}:`, error);
        throw error;
      }
    },
    enabled: !!stationId && mergedOptions.enabled,
    refetchInterval: mergedOptions.refetchInterval,
    staleTime: mergedOptions.staleTime,
  });
  
  // Manual refresh function with query invalidation
  const refresh = async () => {
    if (!stationId) return;
    
    // First invalidate the query to ensure we get fresh data
    await queryClient.invalidateQueries({ queryKey: ['stationArrivals', stationId] });
    
    // Then trigger a refetch with the force refresh option
    return query.refetch();
  };
  
  return {
    ...query,
    lastUpdated,
    refresh
  };
};

export default useStationArrivals;