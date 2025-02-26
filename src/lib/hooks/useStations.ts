// src/lib/hooks/useStations.ts
'use client';

import { useQuery } from '@tanstack/react-query';

/**
 * Custom hook for fetching and caching CTA station data
 * Uses React Query for optimal caching and background updates
 * 
 * @returns {Object} Query result object containing stations data and loading state
 */
export function useStations() {
  const query = useQuery({
    queryKey: ['stations'],
    queryFn: async () => {
      console.log('useStations: Starting fetch');
      try {
        const response = await fetch('/api/cta/stations');
        console.log('useStations: API Response status:', response.status);
        
        if (!response.ok) {
          console.error('useStations: API error:', response.statusText);
          throw new Error('Failed to fetch stations');
        }
        
        const data = await response.json();
        console.log('useStations: Received data:', {
          dataExists: !!data,
          dataLength: Array.isArray(data) ? data.length : 'not an array',
          firstFew: Array.isArray(data) ? data.slice(0, 2) : 'not an array'
        });
        return data;
      } catch (error) {
        console.error('useStations: Fetch error:', error);
        throw error;
      }
    },
    // Cache station data for 7 days to match server-side caching
    staleTime: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  });

  return query;
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