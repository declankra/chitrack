'use client';

import React from 'react';
import Link from 'next/link';
import { useStations } from '@/lib/hooks/useStations';
import { useUserData } from '@/lib/hooks/useUserData';
import HomeStopSection from './HomeStopSection';
import FavoriteSection from './FavoriteSection';
import { getGreeting } from '@/lib/utilities/timeUtils';

/**
 * HomeScreen component - main component for the home page
 */
export default function HomeScreen() {
  const { data: stations = [] } = useStations();
  const { userData } = useUserData();
  
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
            {userData.userName}
          </Link>
        </h1>
        <p className="text-sm text-muted-foreground">
          Let's get you where you need to go
        </p>
      </div>

      {/* Home Stop Section */}
      <HomeStopSection
        homeStopId={userData.homeStop}
        stations={stations}
      />

      {/* Favorite Stops Section */}
      <FavoriteSection
        favoriteStopIds={userData.favoriteStops}
        stations={stations}
      />
    </div>
  );
}