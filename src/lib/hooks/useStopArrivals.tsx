// src/lib/hooks/useStopArrivals.tsx

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import type { StopArrivalsResponse } from '@/lib/types/cta';

interface UseStopArrivalsOptions {
  enabled?: boolean;
  refetchInterval?: number;
  staleTime?: number;
  forceRefresh?: boolean;
  allowBackground?: boolean;
}

const defaultOptions: UseStopArrivalsOptions = {
  enabled: true,
  refetchInterval: 30000, // 30 seconds
  staleTime: 15000,       // 15 seconds
  forceRefresh: true,
  allowBackground: true
};

/**
 * Custom hook to fetch arrivals for a specific stop
 * @param stopId Stop ID to fetch arrivals for
 * @param options Query options
 * @returns Query result object
 */
export const useStopArrivals = (
  stopId: string,
  options: UseStopArrivalsOptions = {}
) => {
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const mergedOptions = { ...defaultOptions, ...options };
  
  return {
    ...useQuery<StopArrivalsResponse, Error>({
      queryKey: ['stopArrivals', stopId],
      queryFn: async () => {
        if (!stopId) {
          throw new Error('No stop ID provided');
        }
        
        try {
          // Set custom headers to help the API determine caching strategy
          const response = await fetch(`/api/cta/arrivals/stop?stopId=${stopId}`, {
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
          
          console.log(`Stop ${stopId} data: Cache ${cacheStatus}, Age: ${cacheAge}s, Fresh: ${isFresh}`);
          
          // Set last updated time
          setLastUpdated(new Date());
          
          const data = await response.json();
          return data as StopArrivalsResponse;
        } catch (error) {
          console.error(`Error fetching arrivals for stop ${stopId}:`, error);
          throw error;
        }
      },
      enabled: !!stopId && mergedOptions.enabled,
      refetchInterval: mergedOptions.refetchInterval,
      staleTime: mergedOptions.staleTime,
    }),
    lastUpdated
  };
};

/**
 * Custom hook to fetch arrivals for multiple stops
 * @param stopIds Array of stop IDs to fetch arrivals for
 * @param options Query options
 * @returns Query result object
 */
export const useMultipleStopArrivals = (
  stopIds: string[],
  options: UseStopArrivalsOptions = {}
) => {
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const mergedOptions = { ...defaultOptions, ...options };
  const validStopIds = stopIds?.filter(Boolean) || [];
  
  return {
    ...useQuery<Record<string, StopArrivalsResponse>, Error>({
      queryKey: ['multipleStopArrivals', validStopIds],
      queryFn: async () => {
        if (!validStopIds.length) {
          return {};
        }
        
        try {
          const results: Record<string, StopArrivalsResponse> = {};
          
          // Fetch arrivals for each stop
          await Promise.all(
            validStopIds.map(async (stopId) => {
              const response = await fetch(`/api/cta/arrivals/stop?stopId=${stopId}`, {
                headers: {
                  'Cache-Control': 'no-cache',
                  'x-force-refresh': mergedOptions.forceRefresh ? 'true' : 'false',
                  'x-allow-background': mergedOptions.allowBackground ? 'true' : 'false'
                }
              });
              
              if (!response.ok) {
                throw new Error(`Failed to fetch arrivals for stop ${stopId}`);
              }
              
              // Check cache status from response headers
              const cacheStatus = response.headers.get('X-Cache');
              const cacheAge = response.headers.get('X-Cache-Age');
              const isFresh = response.headers.get('X-Cache-Fresh') === 'true';
              
              console.log(`Stop ${stopId} data: Cache ${cacheStatus}, Age: ${cacheAge}s, Fresh: ${isFresh}`);
              
              const data = await response.json();
              results[stopId] = data;
            })
          );
          
          // Update last updated timestamp
          setLastUpdated(new Date());
          
          return results;
        } catch (error) {
          console.error('Error fetching favorite stops arrivals:', error);
          throw error;
        }
      },
      enabled: validStopIds.length > 0 && mergedOptions.enabled,
      refetchInterval: mergedOptions.refetchInterval,
      staleTime: mergedOptions.staleTime,
    }),
    lastUpdated
  };
};

export default useStopArrivals;