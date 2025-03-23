// src/lib/hooks/useStopArrivals.tsx

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useRef } from 'react';
import { useTime } from '@/lib/providers/TimeProvider';
import type { StopArrivalsResponse } from '@/lib/types/cta';

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

interface UseStopArrivalsOptions {
  enabled?: boolean;
  refetchInterval?: number;
  staleTime?: number;
  cacheTime?: number;
  forceRefresh?: boolean;
  allowBackground?: boolean;
}

const defaultOptions: UseStopArrivalsOptions = {
  enabled: true,
  refetchInterval: 15000,    // Reduced to 15 seconds for more frequent updates
  staleTime: 1000,          // 1 second stale time to allow for some caching but quick invalidation
  cacheTime: 30000,         // 30 seconds cache time
  forceRefresh: false,      // Keep false by default
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
  
  const query = useQuery<StopArrivalsResponse, Error>({
    queryKey: ['stopArrivals', stopId, currentTime.getTime()],
    queryFn: async () => {
      // Abort any previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // Create a new abort controller for this request
      abortControllerRef.current = createAbortController();
      
      if (!stopId) {
        throw new Error('No stop ID provided');
      }
      
      try {
        const fetchOptions: RequestInit = {
          headers: {
            'Cache-Control': 'no-cache',
            // Force refresh when explicitly requested by the user
            'x-force-refresh': mergedOptions.forceRefresh ? 'true' : 'false',
          }
        };
        
        // Only add signal if AbortController is supported
        if (abortControllerRef.current.signal) {
          fetchOptions.signal = abortControllerRef.current.signal;
        }
        
        // Set custom headers to help the API determine caching strategy
        const response = await fetch(`/api/cta/arrivals/stop?stopId=${stopId}`, fetchOptions);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status} – ${response.statusText || 'Network error'}`);
        }
        
        // Check cache status from response headers for debugging
        const cacheStatus = response.headers.get('X-Cache');
        const cacheAge = response.headers.get('X-Cache-Age');
        const isFresh = response.headers.get('X-Cache-Fresh') === 'true';
        
        console.log(`Stop ${stopId} data: Cache ${cacheStatus}, Age: ${cacheAge}s, Fresh: ${isFresh}`);
        
        // Update last refresh time in TimeProvider
        updateLastRefreshTime();
        
        // Set last updated time
        const newUpdateTime = new Date();
        setLastUpdated(newUpdateTime);
        
        const data = await response.json();
        return data as StopArrivalsResponse;
      } catch (error) {
        // Don't log aborted request errors - they're expected
        if (error instanceof DOMException && error.name === 'AbortError') {
          console.log(`Request for stop ${stopId} was aborted`);
          throw new Error('Request aborted');
        }
        
        console.error(`Error fetching arrivals for stop ${stopId}:`, error);
        throw error;
      }
    },
    enabled: !!stopId && mergedOptions.enabled,
    refetchInterval: mergedOptions.refetchInterval,
    staleTime: mergedOptions.staleTime,
  });
  
  // Manual refresh function with query invalidation
  const refresh = async () => {
    if (!stopId) return;
    
    // First invalidate the query to ensure we get fresh data
    await queryClient.invalidateQueries({ queryKey: ['stopArrivals', stopId] });
    
    // Then trigger a refetch with the force refresh option
    return query.refetch();
  };
  
  return {
    ...query,
    lastUpdated,
    refresh
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
  const { currentTime, updateLastRefreshTime } = useTime();
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const mergedOptions = { ...defaultOptions, ...options };
  const validStopIds = stopIds?.filter(Boolean) || [];
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
  
  const query = useQuery<Record<string, StopArrivalsResponse>, Error>({
    queryKey: ['multipleStopArrivals', validStopIds, currentTime.getTime()],
    queryFn: async () => {
      // Abort any previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // Create a new abort controller for this request
      abortControllerRef.current = createAbortController();
      
      if (!validStopIds.length) {
        return {};
      }
      
      try {
        const results: Record<string, StopArrivalsResponse> = {};
        
        // Fetch arrivals for each stop with a single Promise.all for better performance
        await Promise.all(
          validStopIds.map(async (stopId) => {
            const fetchOptions: RequestInit = {
              headers: {
                'Cache-Control': 'no-cache',
                'x-force-refresh': mergedOptions.forceRefresh ? 'true' : 'false',
              }
            };
            
            // Only add signal if AbortController is supported
            if (abortControllerRef.current.signal) {
              fetchOptions.signal = abortControllerRef.current.signal;
            }
            
            const response = await fetch(`/api/cta/arrivals/stop?stopId=${stopId}`, fetchOptions);
            
            if (!response.ok) {
              throw new Error(`Failed to fetch arrivals for stop ${stopId}`);
            }
            
            // Check cache status from response headers for debugging
            const cacheStatus = response.headers.get('X-Cache');
            const cacheAge = response.headers.get('X-Cache-Age');
            const isFresh = response.headers.get('X-Cache-Fresh') === 'true';
            
            console.log(`Stop ${stopId} data: Cache ${cacheStatus}, Age: ${cacheAge}s, Fresh: ${isFresh}`);
            
            // Update last refresh time in TimeProvider
            updateLastRefreshTime();
            
            const data = await response.json();
            results[stopId] = data;
          })
        );
        
        // Update last updated timestamp
        const newUpdateTime = new Date();
        setLastUpdated(newUpdateTime);
        
        return results;
      } catch (error) {
        // Don't log aborted request errors - they're expected
        if (error instanceof DOMException && error.name === 'AbortError') {
          console.log(`Request for multiple stops was aborted`);
          throw new Error('Request aborted');
        }
        
        console.error('Error fetching favorite stops arrivals:', error);
        throw error;
      }
    },
    enabled: validStopIds.length > 0 && mergedOptions.enabled,
    refetchInterval: mergedOptions.refetchInterval,
    staleTime: mergedOptions.staleTime,
  });
  
  // Manual refresh function with query invalidation
  const refresh = async () => {
    if (!validStopIds.length) return;
    
    // First invalidate the query to ensure we get fresh data
    await queryClient.invalidateQueries({ queryKey: ['multipleStopArrivals', validStopIds] });
    
    // Then trigger a refetch with the force refresh option
    return query.refetch();
  };
  
  return {
    ...query,
    lastUpdated,
    refresh
  };
};

export default useStopArrivals;