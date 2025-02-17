// src/lib/hooks/useStations.ts
'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchStationsDynamic, type Station } from '../data/stations2';

/**
 * Custom hook for fetching and caching CTA station data
 * Uses React Query for optimal caching and background updates
 * 
 * @returns {Object} Query result object containing stations data and loading state
 */
export function useStations() {
  return useQuery<Station[]>({
    queryKey: ['stations'],
    queryFn: fetchStationsDynamic,
    staleTime: 24 * 60 * 60 * 1000, // Consider data fresh for 24 hours
    gcTime: 7 * 24 * 60 * 60 * 1000, // Keep in cache for 7 days
    refetchOnMount: false, // Don't refetch on every mount
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    retry: 3, // Retry failed requests 3 times
    initialData: [], // Start with empty array to prevent undefined checks
  });
}

/**
 * Example usage in a component:
 * 
 * function StationList() {
 *   const { data: stations, isLoading, error } = useStations();
 * 
 *   if (isLoading) return <LoadingSpinner />;
 *   if (error) return <ErrorMessage error={error} />;
 * 
 *   return (
 *     <ul>
 *       {stations.map(station => (
 *         <li key={station.stationId}>{station.stationName}</li>
 *       ))}
 *     </ul>
 *   );
 * }
 */ 