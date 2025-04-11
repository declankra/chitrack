// src/components/home/HomeStopSection.tsx
'use client';

import React, { useMemo } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { House, MapPin, RefreshCw, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import RouteIndicator from '@/components/shared/RouteIndicator';
import { useStopArrivals } from '@/lib/hooks/useStopArrivals';
import { useRefreshAnimation } from '@/lib/hooks/useRefreshAnimation';
import { formatRelativeTime, parseCtaDate, formatTimeDisplay, filterStaleArrivals } from '@/lib/utilities/timeUtils';
import { findStopById } from '@/lib/utilities/findStop';
import { useTime } from '@/lib/providers/TimeProvider';
import type { Station, Arrival, StationStop } from '@/lib/types/cta';
import ArrivalTimeDisplay from '@/components/shared/ArrivalTimeDisplay';

interface HomeStopSectionProps {
  homeStopId: string | null;
  stations: Station[];
  className?: string;
}

/**
 * HomeStopSection component - displays the user's home stop with arrivals
 */
export const HomeStopSection: React.FC<HomeStopSectionProps> = ({
  homeStopId,
  stations,
  className
}) => {
  const { currentTime } = useTime();

  // Call findStopById only if homeStopId is not null
  const staticHomeStopDetails = useMemo(() => {
    return homeStopId ? findStopById(homeStopId, stations) : undefined;
  }, [homeStopId, stations]);

  const {
    data: homeStopArrivals,
    isLoading: homeStopLoading,
    error: homeStopError,
    refresh: refreshHomeStop,
    isRefetching: isRefetchingHomeStop,
    lastUpdated: homeStopLastUpdated
    // Pass empty string if homeStopId is null to satisfy type, but rely on enabled flag
  } = useStopArrivals(homeStopId ?? '', { enabled: !!homeStopId });

  const { isAnimating, triggerAnimation } = useRefreshAnimation();

  const filteredArrivals = useMemo(() => {
    if (!homeStopArrivals?.arrivals) return [];
    return filterStaleArrivals(homeStopArrivals.arrivals, 2, currentTime);
  }, [homeStopArrivals, currentTime]);

  const displayInfo = useMemo(() => {
    if (homeStopArrivals?.arrivals && homeStopArrivals.arrivals.length > 0) {
      const firstArrival = homeStopArrivals.arrivals[0];
      return {
        stationName: firstArrival.staNm,
        directionName: firstArrival.stpDe || 'Direction Info Unavailable'
      };
    } else if (staticHomeStopDetails) {
      return {
        stationName: staticHomeStopDetails.station.stationName,
        directionName: staticHomeStopDetails.stop.directionName || 'Direction Info Unavailable'
      };
    }
    return { stationName: 'Loading...', directionName: 'Loading...' };
  }, [homeStopArrivals, staticHomeStopDetails]);

  const handleRefresh = () => {
    if (!homeStopId) return;
    triggerAnimation();
    refreshHomeStop();
  };

  // If no home stop is set
  if (!homeStopId) {
    return (
      <Card className={cn("", className)}>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <House className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Home Stop</h2>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-muted-foreground mb-3">Set your home stop to see arrivals here</p>
            <Button asChild variant="outline" size="sm">
              <Link href="/settings">Set Home Stop</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // If homeStopId is valid, proceed with rendering the card
  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <House className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Home Stop</h2>
          </div>

          <div className="flex items-center gap-2">
            {homeStopLastUpdated && (
              <span className="text-xs text-muted-foreground">
                {formatRelativeTime(homeStopLastUpdated, currentTime)}
              </span>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleRefresh}
              disabled={isRefetchingHomeStop || !homeStopId}
            >
              <RefreshCw
                className={cn(
                  "h-4 w-4",
                  (isAnimating || isRefetchingHomeStop) && "animate-spin"
                )}
              />
              <span className="sr-only">Refresh</span>
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Stop details */} 
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <div className="flex-grow min-w-0">
            <h3 className="font-semibold truncate" title={displayInfo.stationName}>{displayInfo.stationName}</h3>
            <p className="text-xs text-muted-foreground truncate" title={displayInfo.directionName}>{displayInfo.directionName}</p>
          </div>
        </div>

        {/* Arrivals content - use homeStopLoading */} 
        {homeStopLoading ? (
          <div className="flex justify-center py-4">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Loading...</span>
            </div>
          </div>
        ) : homeStopError ? (
          <div className="flex items-center justify-center py-3 px-4 bg-destructive/10 text-destructive rounded">
            <AlertCircle className="h-4 w-4 mr-2" />
            <div>
              <p className="text-sm font-medium">Failed to load arrivals</p>
              <p className="text-xs mt-1">Please try refreshing</p>
            </div>
          </div>
        ) : !filteredArrivals.length ? (
          <div className="text-center py-4">
            <p className="text-muted-foreground">No upcoming arrivals</p>
            <p className="text-xs text-muted-foreground mt-1">
              {homeStopArrivals?.arrivals && homeStopArrivals.arrivals.length > 0
                ? "Next trains are not arriving soon"
                : "No trains currently scheduled"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredArrivals.map((arrival, idx) => (
              <div key={idx} className="flex items-center justify-between border-b pb-3 last:border-b-0 last:pb-0">
                <div className="flex items-center gap-2">
                  <RouteIndicator route={arrival.rt} />
                  <div>
                    <p className="font-medium">{arrival.destNm}</p>
                  </div>
                </div>
                <ArrivalTimeDisplay arrival={arrival} currentTime={currentTime} />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default HomeStopSection;