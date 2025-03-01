// src/lib/hooks/useStationArrivals.tsx
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import type { StationArrivalsResponse } from '@/lib/types/cta';

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
  staleTime: 15000,       // 15 seconds
  forceRefresh: true,
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
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const mergedOptions = { ...defaultOptions, ...options };
  
  return {
    ...useQuery<StationArrivalsResponse[], Error>({
      queryKey: ['stationArrivals', stationId],
      queryFn: async () => {
        if (!stationId) {
          throw new Error('No station ID provided');
        }
        
        try {
          // Set custom headers to help the API determine caching strategy
          const response = await fetch(`/api/cta/arrivals/station?stations=${stationId}`, {
            headers: {
              'Cache-Control': 'no-cache',
              // Force refresh when explicitly requested by the user
              'x-force-refresh': mergedOptions.forceRefresh ? 'true' : 'false',
              // Enable background refresh for automatic updates
              'x-allow-background': mergedOptions.allowBackground ? 'true' : 'false'
            }
          });
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status} – ${response.statusText || 'Network error'}`);
          }
          
          // Check cache status from response headers
          const cacheStatus = response.headers.get('X-Cache');
          const cacheAge = response.headers.get('X-Cache-Age');
          const isFresh = response.headers.get('X-Cache-Fresh') === 'true';
          
          console.log(`Station ${stationId} data: Cache ${cacheStatus}, Age: ${cacheAge}s, Fresh: ${isFresh}`);
          
          // Set last updated time
          setLastUpdated(new Date());
          
          const data = await response.json();
          return data as StationArrivalsResponse[];
        } catch (error) {
          console.error(`Error fetching arrivals for station ${stationId}:`, error);
          throw error;
        }
      },
      enabled: !!stationId && mergedOptions.enabled,
      refetchInterval: mergedOptions.refetchInterval,
      staleTime: mergedOptions.staleTime,
    }),
    lastUpdated
  };
};

export default useStationArrivals;