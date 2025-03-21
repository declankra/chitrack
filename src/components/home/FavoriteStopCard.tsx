import React from 'react';
import { Card } from '@/components/ui/card';
import { MapPin, AlertCircle, RefreshCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import RouteIndicator from '@/components/shared/RouteIndicator';
import { useStopArrivals } from '@/lib/hooks/useStopArrivals';
import { formatTimeDisplay, parseCtaDate, filterStaleArrivals } from '@/lib/utilities/timeUtils';
import { useTime } from '@/lib/providers/TimeProvider';
import type { Station, StationStop, Arrival } from '@/lib/types/cta';
import ArrivalTimeDisplay from '@/components/shared/ArrivalTimeDisplay';

interface FavoriteStopCardProps {
  station: Station;
  stop: StationStop;
  className?: string;
}

/**
 * FavoriteStopCard component - displays a favorite stop with arrivals
 */
export const FavoriteStopCard: React.FC<FavoriteStopCardProps> = ({
  station,
  stop,
  className
}) => {
  // Use the centralized time provider instead of a local timer
  const { currentTime } = useTime();
  
  // Fetch arrivals for this stop
  const {
    data: stopArrivals,
    isLoading,
    isError,
    error,
    refresh,
    isRefetching,
  } = useStopArrivals(stop.stopId);
  
  // Filter stale arrivals
  const filteredArrivals = React.useMemo(() => {
    if (!stopArrivals?.arrivals) return [];
    return filterStaleArrivals(stopArrivals.arrivals, 2, currentTime);
  }, [stopArrivals, currentTime]);

  // Handle refresh button click
  const handleRefresh = (e: React.MouseEvent) => {
    e.stopPropagation();
    refresh();
  };
  
  return (
    <Card className={cn('p-4 rounded-lg', className)}>
      {/* Favorite stop header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <div>
            <h3 className="font-semibold">{station.stationName}</h3>
            <p className="text-xs text-muted-foreground">{stop.directionName}</p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          className="p-1 rounded-full hover:bg-muted transition-colors"
          aria-label="Refresh arrivals"
        >
          <RefreshCcw 
            className={cn(
              "h-4 w-4 text-muted-foreground",
              isRefetching && "animate-spin"
            )} 
          />
        </button>
      </div>
      
      {/* Arrivals content */}
      {isLoading && !stopArrivals ? (
        <div className="flex justify-center py-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Loading...</span>
          </div>
        </div>
      ) : isError ? (
        <div className="flex items-center justify-center py-2 px-3 bg-destructive/10 text-destructive rounded-md">
          <AlertCircle className="h-4 w-4 mr-2" />
          <p className="text-sm">Failed to load arrivals</p>
        </div>
      ) : !filteredArrivals.length ? (
        <div className="text-center py-2">
          <p className="text-sm text-muted-foreground">No upcoming arrivals</p>
          <p className="text-xs text-muted-foreground mt-1">
            {stopArrivals?.arrivals && stopArrivals.arrivals.length > 0 
              ? "Next trains are not arriving soon" 
              : "No trains currently scheduled"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredArrivals.slice(0, 2).map((arrival, idx) => (
            <div key={idx} className="flex items-center justify-between border-b pb-2 last:border-b-0 last:pb-0">
              <div className="flex items-center gap-2">
                <RouteIndicator route={arrival.rt} size="sm" />
                <div>
                  <p className="font-medium text-sm">{arrival.destNm}</p>
                </div>
              </div>
              <ArrivalTimeDisplay arrival={arrival} currentTime={currentTime} />
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

export default FavoriteStopCard;