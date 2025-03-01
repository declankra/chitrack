import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { House, MapPin, RefreshCw, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import RouteIndicator from '@/components/shared/RouteIndicator';
import { useStopArrivals } from '@/lib/hooks/useStopArrivals';
import { useRefreshAnimation } from '@/lib/hooks/useRefreshAnimation';
import { formatRelativeTime, parseCtaDate, formatTimeDisplay } from '@/lib/utilities/timeUtils';
import { findStopById } from '@/lib/utilities/findStop';
import type { Station, Arrival } from '@/lib/types/cta';

interface HomeStopSectionProps {
  homeStopId: string;
  stations: Station[];
  className?: string;
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

/**
 * HomeStopSection component - displays the user's home stop with arrivals
 */
export const HomeStopSection: React.FC<HomeStopSectionProps> = ({
  homeStopId,
  stations,
  className
}) => {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  
  // Get home stop details
  const homeStopDetails = findStopById(homeStopId, stations);
  
  // Fetch arrivals for home stop
  const {
    data: homeStopArrivals,
    isLoading: homeStopLoading,
    error: homeStopError,
    refetch: refetchHomeStop,
    lastUpdated: homeStopLastUpdated
  } = useStopArrivals(homeStopId, { enabled: !!homeStopId });
  
  // Animation state for refresh button
  const { isAnimating, triggerAnimation } = useRefreshAnimation();
  
  // Update current time every minute
  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  // Handle refresh with animation
  const handleRefresh = () => {
    triggerAnimation();
    refetchHomeStop();
  };
  
  return (
    <Card className={className}>
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
            {homeStopDetails && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={homeStopLoading}
                aria-label="Refresh home stop arrivals"
              >
                <RefreshCw className={cn("h-4 w-4", { "animate-spin": homeStopLoading || isAnimating })} />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {homeStopDetails ? (
          <div>
            {/* Home stop header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <h3 className="font-semibold">{homeStopDetails.station.stationName}</h3>
                  <p className="text-xs text-muted-foreground">{homeStopDetails.stop.directionName}</p>
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
                    <ArrivalTimeDisplay
                      arrival={arrival}
                      currentTime={currentTime}
                    />
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
  );
};

export default HomeStopSection;