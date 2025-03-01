// src/components/utilities/HomeScreen.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useStations } from '@/lib/hooks/useStations';
import { useQuery } from '@tanstack/react-query';
import { getSupabase } from '@/lib/supabase';
import { House, MapPin, RefreshCw, Clock, Star, Settings, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Station, StationStop, RouteColor } from '@/lib/types/cta';
import { ROUTE_COLORS } from '@/lib/types/cta';
import type { UserData, SupabaseUserData, ArrivalInfo, FavoriteStopsArrivalsType } from '@/lib/types/user';

// Helper function to get greeting based on time of day
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 6) return 'Good early morning';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

/**
 * Format the relative time since last update
 * @param date Last updated timestamp
 * @param currentTime Current time
 */
const formatRelativeTime = (date: Date | null, currentTime: Date): string => {
  if (!date) return '';
  const diffMs = currentTime.getTime() - date.getTime();
  const diffMins = Math.round(diffMs / 60000);
  
  if (diffMins < 1) return 'just now';
  return `${diffMins}m ago`;
};

/**
 * Parse CTA arrival time to a Date object
 * @param ctaTime CTA arrival time in "YYYYMMDD HH:mm:ss" or ISO 8601 format
 */
const parseCtaDate = (ctaTime: string): Date | null => {
  try {
    // Handle ISO-8601 format (e.g. "2025-02-18T12:43:48")
    if (ctaTime.includes('T')) {
      const d = new Date(ctaTime);
      return Number.isNaN(d.getTime()) ? null : d;
    }
    
    // Handle CTA custom format ("YYYYMMDD HH:mm:ss")
    if (!ctaTime || !ctaTime.includes(" ")) {
      return null;
    }
    
    const [datePart, timePart] = ctaTime.split(" ");
    if (!datePart || !timePart) {
      return null;
    }
    
    const year = +datePart.slice(0, 4);
    const month = +datePart.slice(4, 6) - 1;
    const day = +datePart.slice(6, 8);
    const [hour, minute, second] = timePart.split(":").map(Number);

    const d = new Date(year, month, day, hour, minute, second);
    return Number.isNaN(d.getTime()) ? null : d;
  } catch (err) {
    console.error("Error parsing CTA date:", err);
    return null;
  }
};

/**
 * Format CTA arrival time to user-friendly display
 * @param arrivalTime CTA arrival time in "YYYYMMDD HH:mm:ss" or ISO 8601 format
 * @param isApproaching Whether train is approaching (isApp="1")
 * @param isDelayed Whether train is delayed (isDly="1")
 */
const formatArrivalTime = (arrivalTime: string, isApproaching: boolean, isDelayed: boolean) => {
  try {
    const arrTime = parseCtaDate(arrivalTime);
    const now = new Date();
    
    // If invalid date, return placeholder
    if (!arrTime) return 'N/A';
    
    // If the train is approaching
    if (isApproaching) {
      return (
        <div className="flex flex-col items-end">
          <span className="text-lg font-bold text-destructive">Due</span>
          <span className="text-xs text-muted-foreground">
            {arrTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
          </span>
        </div>
      );
    }
    
    // If the train is delayed
    if (isDelayed) {
      return (
        <div className="flex flex-col items-end">
          <span className="text-amber-500 flex items-center gap-1 font-medium">
            <AlertCircle className="w-3 h-3" /> Delayed
          </span>
          <span className="text-xs text-muted-foreground">
            {arrTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
          </span>
        </div>
      );
    }
    
    // Calculate minutes until arrival
    const diffMs = arrTime.getTime() - now.getTime();
    const diffMin = Math.round(diffMs / 60000);
    
    if (diffMin <= 0) {
      return (
        <div className="flex flex-col items-end">
          <span className="text-lg font-bold text-destructive">Due</span>
          <span className="text-xs text-muted-foreground">
            {arrTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
          </span>
        </div>
      );
    }
    
    return (
      <div className="flex flex-col items-end">
        <span className="flex items-baseline gap-1">
          <span className="text-lg font-bold">{diffMin}</span>
          <span className="text-sm font-normal text-muted-foreground">min</span>
        </span>
        <span className="text-xs text-muted-foreground">
          {arrTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
        </span>
      </div>
    );
  } catch (err) {
    console.error('Error formatting arrival time:', err);
    return 'N/A';
  }
};

/**
 * HomeScreen component - main component for the home page
 */
export default function HomeScreen() {
  const router = useRouter();
  const { data: stations = [] } = useStations();
  const [userData, setUserData] = useState<UserData>({
    userName: 'Traveler',
    homeStop: '',
    favoriteStops: [],
  });
  
  // State to track last data refresh times
  const [homeStopLastUpdated, setHomeStopLastUpdated] = useState<Date | null>(null);
  const [favoriteStopsLastUpdated, setFavoriteStopsLastUpdated] = useState<Date | null>(null);
  // Current time for relative time display - updates every minute
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  
  // Set up a timer to update the current time display every minute
  useEffect(() => {
    // Update immediately to sync with real time
    setCurrentTime(new Date());
    
    // Set interval to update every minute
    const intervalId = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // 60 seconds = 1 minute
    
    // Clean up on unmount
    return () => clearInterval(intervalId);
  }, []);
  
  // Fetch user data from Supabase
  const fetchUserData = useCallback(async () => {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('chitrack_users')
        .select('*')
        .eq('userID', 'demo-user')  // Using demo user for simplicity
        .single();
      
      if (error && !data) {
        // User might not exist yet, use default
        return;
      }
      
      if (data) {
        // Cast data to SupabaseUserData type
        const userData = data as unknown as SupabaseUserData;
        setUserData({
          userName: userData.userName || 'Traveler',
          homeStop: userData.homeStop || '',
          favoriteStops: Array.isArray(userData.favoriteStops) ? userData.favoriteStops : [],
        });
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
    }
  }, []);
  
  // Load user data on component mount
  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);
  
  // Get home stop details
  const homeStopDetails = useCallback(() => {
    if (!userData.homeStop || !stations.length) return null;
    
    // Find the parent station containing this stop
    let foundStopDetails: { station: Station, stop: StationStop } | null = null;
    
    for (const station of stations) {
      const matchingStop = station.stops.find((stop: StationStop) => stop.stopId === userData.homeStop);
      if (matchingStop) {
        foundStopDetails = { station, stop: matchingStop };
        break;
      }
    }
    
    return foundStopDetails;
  }, [userData.homeStop, stations]);
  
  // Get favorite stops details
  const favoriteStopsDetails = useCallback(() => {
    if (!userData.favoriteStops?.length || !stations.length) return [];
    
    const details: Array<{ station: Station, stop: StationStop }> = [];
    
    for (const stopId of userData.favoriteStops) {
      if (!stopId) continue;
      
      for (const station of stations) {
        const matchingStop = station.stops.find((stop: StationStop) => stop.stopId === stopId);
        if (matchingStop) {
          details.push({ station, stop: matchingStop });
          break;
        }
      }
    }
    
    return details;
  }, [userData.favoriteStops, stations]);
  
  const homeStop = homeStopDetails();
  const favoriteStops = favoriteStopsDetails();
  
  // Fetch arrivals for home stop with improved headers
  const {
    data: homeStopArrivals,
    isLoading: homeStopLoading,
    error: homeStopError,
    refetch: refetchHomeStop,
    dataUpdatedAt: homeStopUpdatedAt
  } = useQuery({
    queryKey: ['homeStopArrivals', userData.homeStop],
    queryFn: async () => {
      if (!userData.homeStop) return null;
      
      try {
        // Set custom headers to help the API determine caching strategy
        const response = await fetch(`/api/cta/arrivals/stop?stopId=${userData.homeStop}`, {
          headers: {
            'Cache-Control': 'no-cache', 
            // Force refresh when explicitly requested by the user
            'x-force-refresh': 'true',
            // Enable background refresh for automatic updates
            'x-allow-background': 'true'
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status} – ${response.statusText || 'Network error'}`);
        }
        
        // Check cache status from response headers
        const cacheStatus = response.headers.get('X-Cache');
        const cacheAge = response.headers.get('X-Cache-Age');
        const isFresh = response.headers.get('X-Cache-Fresh') === 'true';
        
        console.log(`Home stop data: Cache ${cacheStatus}, Age: ${cacheAge}s, Fresh: ${isFresh}`);
        
        // Set last updated time
        setHomeStopLastUpdated(new Date());
        
        const data = await response.json();
        return data as ArrivalInfo;
      } catch (error) {
        console.error('Error fetching home stop arrivals:', error);
        throw error;
      }
    },
    enabled: !!userData.homeStop,
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 15000, // Consider data fresh for 15 seconds
  });
  
  // Fetch arrivals for favorite stops with improved headers
  const {
    data: favoriteStopsArrivals,
    isLoading: favoriteStopsLoading,
    error: favoriteStopsError,
    refetch: refetchFavoriteStops,
    dataUpdatedAt: favoriteStopsUpdatedAt
  } = useQuery<FavoriteStopsArrivalsType>({
    queryKey: ['favoriteStopsArrivals', userData.favoriteStops],
    queryFn: async () => {
      if (!userData.favoriteStops?.length) return {} as FavoriteStopsArrivalsType;
      
      try {
        const results: FavoriteStopsArrivalsType = {};
        
        // Fetch arrivals for each favorite stop
        await Promise.all(
          userData.favoriteStops.map(async (stopId) => {
            if (!stopId) return;
            
            const response = await fetch(`/api/cta/arrivals/stop?stopId=${stopId}`, {
              headers: {
                'Cache-Control': 'no-cache',
                'x-force-refresh': 'true',
                'x-allow-background': 'true'
              }
            });
            
            if (!response.ok) {
              throw new Error(`Failed to fetch arrivals for stop ${stopId}`);
            }
            
            // Check cache status from response headers
            const cacheStatus = response.headers.get('X-Cache');
            const cacheAge = response.headers.get('X-Cache-Age');
            const isFresh = response.headers.get('X-Cache-Fresh') === 'true';
            
            console.log(`Favorite stop ${stopId} data: Cache ${cacheStatus}, Age: ${cacheAge}s, Fresh: ${isFresh}`);
            
            const data = await response.json();
            results[stopId] = data;
          })
        );
        
        // Update last updated timestamp
        setFavoriteStopsLastUpdated(new Date());
        
        return results;
      } catch (error) {
        console.error('Error fetching favorite stops arrivals:', error);
        throw error;
      }
    },
    enabled: userData.favoriteStops?.length > 0,
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 15000, // Consider data fresh for 15 seconds
  });
  
  // Function to handle manual refresh of all data
  const handleManualRefresh = () => {
    refetchHomeStop();
    refetchFavoriteStops();
  };
  
  // Function to handle manual refresh of home stop only
  const handleHomeStopRefresh = () => {
    refetchHomeStop();
  };
  
  // Function to handle manual refresh of favorite stops only
  const handleFavoriteStopsRefresh = () => {
    refetchFavoriteStops();
  };
  
  // Function to render route color indicator
  const RouteIndicator = ({ route }: { route: string }) => {
    const normalizedRoute = route as RouteColor;
    const routeColorClass = ROUTE_COLORS[normalizedRoute] || 'bg-gray-600';
    
    return (
      <div className={cn('w-3 h-3 rounded-full', routeColorClass)} />
    );
  };

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
          Let's get you where you need to go.
        </p>
      </div>

      {/* Home Stop Section */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <House className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-medium">Home Stop</h2>
            </div>
            <div className="flex items-center gap-2">
              {homeStopLastUpdated && (
                <span className="text-xs text-muted-foreground">
                  {formatRelativeTime(homeStopLastUpdated, currentTime)}
                </span>
              )}
              {homeStop && (
                <Button variant="ghost" size="sm" onClick={handleHomeStopRefresh} disabled={homeStopLoading}>
                  <RefreshCw className={cn("h-4 w-4", { "animate-spin": homeStopLoading })} />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {homeStop ? (
            <div>
              {/* Home stop header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <h3 className="font-semibold">{homeStop.station.stationName}</h3>
                    <p className="text-xs text-muted-foreground">{homeStop.stop.directionName}</p>
                  </div>
                </div>
              </div>
              
              {/* Home stop arrivals */}
              {homeStopLoading && !homeStopArrivals ? (
                <div className="flex justify-center py-4">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Loading arrivals...</span>
                  </div>
                </div>
              ) : homeStopError ? (
                <div className="flex items-center justify-center py-4 px-3 bg-destructive/10 text-destructive rounded-md">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  <p className="text-sm">Failed to load arrivals. Please try again.</p>
                </div>
              ) : !homeStopArrivals?.arrivals.length ? (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">No upcoming arrivals</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {homeStopArrivals.arrivals.slice(0, 3).map((arrival, idx) => (
                    <div key={idx} className="flex items-center justify-between border-b pb-2 last:border-b-0 last:pb-0">
                      <div className="flex items-center gap-2">
                        <RouteIndicator route={arrival.rt} />
                        <div>
                          <p className="font-medium">{arrival.destNm}</p>
                        </div>
                      </div>
                      {formatArrivalTime(arrival.arrT, arrival.isApp === "1", arrival.isDly === "1")}
                    </div>
                  ))}
                </div>
              )}
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
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-medium">Favorite Stops</h2>
            </div>
            <div className="flex items-center gap-2">
              {favoriteStopsLastUpdated && (
                <span className="text-xs text-muted-foreground">
                  {formatRelativeTime(favoriteStopsLastUpdated, currentTime)}
                </span>
              )}
              {favoriteStops.length > 0 && (
                <Button variant="ghost" size="sm" onClick={handleFavoriteStopsRefresh} disabled={favoriteStopsLoading}>
                  <RefreshCw className={cn("h-4 w-4", { "animate-spin": favoriteStopsLoading })} />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {favoriteStops && favoriteStops.length > 0 ? (
            <div className="space-y-4">
              {favoriteStops.map((stop, index) => {
                const stopId = stop.stop.stopId;
                const stopArrivals = favoriteStopsArrivals?.[stopId];
                const isLoading = favoriteStopsLoading && !stopArrivals;
                const hasError = favoriteStopsError;
                
                return (
                  <div key={stopId} className="p-4 rounded-lg border">
                    {/* Favorite stop header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <h3 className="font-semibold">{stop.station.stationName}</h3>
                          <p className="text-xs text-muted-foreground">{stop.stop.directionName}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Favorite stop arrivals */}
                    {isLoading ? (
                      <div className="flex justify-center py-2">
                        <div className="flex items-center gap-2">
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          <span className="text-sm text-muted-foreground">Loading...</span>
                        </div>
                      </div>
                    ) : hasError ? (
                      <div className="flex items-center justify-center py-2 px-3 bg-destructive/10 text-destructive rounded-md">
                        <AlertCircle className="h-4 w-4 mr-2" />
                        <p className="text-sm">Failed to load arrivals</p>
                      </div>
                    ) : !stopArrivals?.arrivals.length ? (
                      <div className="text-center py-2">
                        <p className="text-sm text-muted-foreground">No upcoming arrivals</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {stopArrivals.arrivals.slice(0, 2).map((arrival, idx) => (
                          <div key={idx} className="flex items-center justify-between border-b pb-2 last:border-b-0 last:pb-0">
                            <div className="flex items-center gap-2">
                              <RouteIndicator route={arrival.rt} />
                              <div>
                                <p className="font-medium text-sm">{arrival.destNm}</p>
                              </div>
                            </div>
                            {formatArrivalTime(arrival.arrT, arrival.isApp === "1", arrival.isDly === "1")}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
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