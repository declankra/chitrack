'use client';

import React from 'react';
import Link from 'next/link';
import { useStations } from '@/lib/hooks/useStations';
import { useUserData } from '@/lib/hooks/useUserData';
import HomeStopSection from './HomeStopSection';
import FavoriteSection from './FavoriteSection';
import { getGreeting } from '@/lib/utilities/timeUtils';
import { Skeleton } from '@/components/ui/skeleton';
/**
 * HomeScreen component - main component for the home page
 */
export default function HomeScreen() {
  const { data: stations = [], isLoading: stationsLoading } = useStations();
  const { userData, isLoading: userDataLoading } = useUserData();
  
  const isLoading = stationsLoading || userDataLoading;

  if (isLoading || !userData) {
    return (
      <div className="space-y-6">
        <div className="space-y-1 mb-8">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-5 w-1/2" />
        </div>
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const favoriteStopIds = userData.favoriteStops?.map(stop => stop.stop_id) ?? [];
  const homeStopId = userData.homeStop?.stop_id ?? null;

  return (
    <div className="space-y-6">
      {/* Greeting Section */}
      <div className="space-y-1 mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">
          {getGreeting()},
          <Link 
            href="/settings"
            className="inline-block border-b border-dotted border-primary ml-2 hover:border-solid transition-all"
          >
            {userData.userName || 'Traveler'}
          </Link>
        </h1>
        <p className="text-sm text-muted-foreground">
          Let's get you where you need to go
        </p>
      </div>

      {/* Home Stop Section */}
      <HomeStopSection
        homeStopId={homeStopId}
        stations={stations}
      />

      {/* Favorite Stops Section */}
      <FavoriteSection
        favoriteStopIds={favoriteStopIds}
        stations={stations}
      />
    </div>
  );
}