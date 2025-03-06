// src/components/search/ArrivalBoard.tsx
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCcw, AlertCircle, MapPin, ArrowRight } from 'lucide-react';
import { cn } from "@/lib/utils";
import { useRefreshAnimation } from '@/lib/hooks/useRefreshAnimation';
import type { Arrival } from "@/lib/types/cta";
import RouteIndicator, { getFullLineName, getRouteBackgroundClass } from '@/components/shared/RouteIndicator';
import { formatRelativeTime, parseCtaDate, formatTimeDisplay } from '@/lib/utilities/timeUtils';

interface ArrivalBoardProps {
  arrivals: any[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  onRefresh: () => void;
  stationName: string;
}

/**
 * Renders arrival time with status indicators for a train
 */
const ArrivalTimeDisplay: React.FC<{
  arrival: Arrival;
  currentTime: Date;
}> = ({ arrival, currentTime }) => {
  const isApproaching = arrival.isApp === '1';
  const isDelayed = arrival.isDly === '1';
  const arrTime = parseCtaDate(arrival.arrT);
  
  if (!arrTime) return <div>N/A</div>;
  
  // If the train is approaching
  if (isApproaching) {
    return (
      <div className="flex flex-col items-end">
        <span className="text-lg font-bold text-destructive">Due</span>
        <span className="text-xs text-muted-foreground">
          {formatTimeDisplay(arrTime)}
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
          {formatTimeDisplay(arrTime)}
        </span>
      </div>
    );
  }
  
  // Calculate minutes until arrival
  const diffMs = arrTime.getTime() - currentTime.getTime();
  const diffMin = Math.round(diffMs / 60000);
  
  if (diffMin <= 0) {
    return (
      <div className="flex flex-col items-end">
        <span className="text-lg font-bold text-destructive">Due</span>
        <span className="text-xs text-muted-foreground">
          {formatTimeDisplay(arrTime)}
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
        {formatTimeDisplay(arrTime)}
      </span>
    </div>
  );
};

export default function ArrivalBoard({ 
  arrivals, 
  loading, 
  error, 
  lastUpdated, 
  onRefresh,
  stationName
}: ArrivalBoardProps) {
  // Use a state variable to track current time for UI updates
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  
  // Animation state for refresh button
  const { isAnimating, triggerAnimation } = useRefreshAnimation();

  // Set up a timer to update the display every 15 seconds
  useEffect(() => {
    // Update immediately to sync with real time
    setCurrentTime(new Date());
    
    // Set interval to update every 15 seconds (changed from 60)
    const intervalId = setInterval(() => {
      setCurrentTime(new Date());
    }, 15000); // 15 seconds
    
    // Clean up on unmount
    return () => clearInterval(intervalId);
  }, []);
  
  // Handle refresh with animation
  const handleRefresh = () => {
    triggerAnimation();
    onRefresh();
  };

  // Process arrivals data to group by route first
  const routeGroupedArrivals = useMemo(() => {
    // Group arrivals by route
    const routeGroups: Record<string, {
      route: string,
      arrivals: Arrival[],
      stopNames: Set<string>
    }> = {};
    
    arrivals.forEach((station: any) => {
      station.stops.forEach((stop: any) => {
        stop.arrivals.forEach((arrival: Arrival) => {
          const route = arrival.rt;
          
          if (!routeGroups[route]) {
            routeGroups[route] = {
              route,
              arrivals: [],
              stopNames: new Set()
            };
          }
          
          routeGroups[route].arrivals.push({
            ...arrival,
            stpDe: stop.stopName // Use stop name for context
          });
          routeGroups[route].stopNames.add(stop.stopName);
        });
      });
    });
    
    // Sort arrivals within each route by time
    Object.values(routeGroups).forEach(group => {
      group.arrivals.sort((a, b) => {
        const aTime = parseCtaDate(a.arrT);
        const bTime = parseCtaDate(b.arrT);
        if (!aTime || !bTime) return 0;
        return aTime.getTime() - bTime.getTime();
      });
    });
    
    return Object.values(routeGroups);
  }, [arrivals]);

  return (
    <div className="flex-1 overflow-y-auto pb-24">
      {/* Station Header with Backdrop Blur */}
      <div className="sticky top-0 z-10 backdrop-blur-sm bg-background/80 p-4 mb-4 flex items-center justify-between border-b">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-muted-foreground" />
          <h1 className="text-xl font-bold">{stationName}</h1>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="text-xs text-muted-foreground">
              {formatRelativeTime(lastUpdated, currentTime)}
            </span>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={loading}
            aria-label="Refresh arrivals"
          >
            <RefreshCcw className={cn("w-4 h-4", { "animate-spin": loading || isAnimating })} />
          </Button>
        </div>
      </div>
      
      {/* Error Message */}
      {error && (
        <div className="mx-4 mb-4 p-3 bg-destructive/10 text-destructive rounded-md flex items-start">
          <AlertCircle className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}
      
      {/* Loading State */}
      {loading && arrivals.length === 0 && !error && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-pulse flex flex-col items-center">
            <RefreshCcw className="w-6 h-6 text-muted-foreground animate-spin" />
            <p className="mt-2 text-sm text-muted-foreground">Loading arrivals...</p>
          </div>
        </div>
      )}
      
      {/* Empty State */}
      {arrivals.length === 0 && !error && !loading && (
        <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
          <p className="text-muted-foreground mb-2">No arrival information available</p>
          <Button variant="outline" size="sm" onClick={handleRefresh} className="mt-2">
            <RefreshCcw className={cn("w-4 h-4 mr-2", { "animate-spin": isAnimating })} />
            Refresh
          </Button>
        </div>
      )}
      
      {/* Route-Grouped Arrivals */}
      <div className="space-y-4 px-4">
        {routeGroupedArrivals.map(({ route, arrivals, stopNames }) => {
          const routeName = getFullLineName(route);
          
          return (
            <Card key={route} className="overflow-hidden">
              {/* Route Header */}
              <div className={cn(
                "px-4 py-3 flex items-center border-b",
                getRouteBackgroundClass(route)
              )}>
                <div className="flex items-center gap-2">
                  <RouteIndicator route={route} />
                  <span className="font-semibold">{routeName} Line</span>
                </div>
              </div>
              
              {/* Arrivals List */}
              <CardContent className="p-0 divide-y">
                {arrivals.length > 0 ? (
                  arrivals.map((arrival, idx) => {
                    const isApproaching = arrival.isApp === "1";
                    const isDelayed = arrival.isDly === "1";
                    const isDue = isApproaching || parseCtaDate(arrival.arrT) &&
                      (new Date().getTime() >= parseCtaDate(arrival.arrT)!.getTime());
                    
                    return (
                      <div
                        key={idx}
                        className={cn(
                          "px-4 py-3 flex items-center justify-between",
                          isDelayed ? "bg-amber-500/5" : isDue ? "bg-destructive/5" : ""
                        )}
                      >
                        {/* Left: Destination with Direction */}
                        <div className="flex items-center gap-2">
                          <ArrowRight className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{arrival.destNm}</div>
                            <div className="text-xs text-muted-foreground">
                              {arrival.stpDe?.replace('Service toward ', '').replace('Platform', '')}
                            </div>
                          </div>
                        </div>
                        
                        {/* Right: Arrival Time */}
                        <ArrivalTimeDisplay
                          arrival={arrival}
                          currentTime={currentTime}
                        />
                      </div>
                    );
                  })
                ) : (
                  <p className="px-4 py-3 text-sm text-muted-foreground">
                    No upcoming arrivals for this line
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}