// src/lib/providers/StationsProvider.tsx

'use client';

import { useStations } from '@/lib/hooks/useStations';
import { useEffect } from 'react';

/**
 * StationsProvider
 * Pre-fetches and manages station data at the app level
 * This ensures station data is ready before components need it
 */
export function StationsProvider({ children }: { children: React.ReactNode }) {
  const { data: stations, isLoading, error } = useStations();

  // Log station data status for debugging
  useEffect(() => {
    console.log('StationsProvider: Mount/Update', {
      isLoading,
      hasError: !!error,
      errorDetails: error,
      hasData: !!stations,
      dataCount: stations?.length ?? 0,
      firstFew: stations?.slice(0, 2)
    });
  }, [stations, isLoading, error]);

  return <>{children}</>;
} 