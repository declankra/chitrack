// src/components/sections/HomeScreen.tsx
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { Train, Star } from 'lucide-react';

// Helper function to get greeting based on time of day
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 6) return 'Good early morning';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

export default function HomeScreen() {
  const router = useRouter();
  
  // Placeholder data until user settings are implemented
  const userData = {
    name: 'Traveler', // Default name
    homeStop: null,
    favoriteStops: []
  };

  return (
    <div className="space-y-6">
      {/* Greeting Section */}
      <div className="space-y-1 mb-16">
        <h1 className="text-2xl font-semibold tracking-tight">
          {getGreeting()},
          <Link 
            href="/settings"
            className="inline-block border-b border-dotted border-primary ml-2 hover:border-solid transition-all"
          >
            {userData.name}
          </Link>
        </h1>
        <p className="text-sm text-muted-foreground">
          Let's get you where you need to go.
        </p>
      </div>

      {/* Home Stop Section */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Home Stop</h2>
            <Train className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          {userData.homeStop ? (
            <div>
              {/* Home stop data will go here */}
              <p>Your home stop data will appear here</p>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground">
                No home stop set. Visit settings to set your most frequent stop.
              </p>
              <Link
                href="/settings"
                className="inline-block mt-2 text-sm text-primary hover:underline"
              >
                Set Home Stop
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Favorite Stops Section */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Favorite Stops</h2>
            <div className="flex items-center space-x-2">
              <Star className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {userData.favoriteStops && userData.favoriteStops.length > 0 ? (
            <div className="space-y-4">
              {userData.favoriteStops.map((stop, index) => (
                <div key={index} className="p-4 rounded-lg border">
                  {/* Favorite stop data will go here */}
                  <p>Favorite stop {index + 1} data will appear here</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground">
                No favorite stops set. Add up to three favorite stops for quick access.
              </p>
              <Link
                href="/settings"
                className="inline-block mt-2 text-sm text-primary hover:underline"
              >
                Add Favorite Stops
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}