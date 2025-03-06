import React from 'react';
import { Card } from '@/components/ui/card';
import { MapPin, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import RouteIndicator from '@/components/shared/RouteIndicator';
import { useStopArrivals } from '@/lib/hooks/useStopArrivals';
import { formatTimeDisplay, parseCtaDate } from '@/lib/utilities/timeUtils';
import type { Station, StationStop, Arrival } from '@/lib/types/cta';

interface FavoriteStopCardProps {
  station: Station;
  stop: StationStop;
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
 * FavoriteStopCard component - displays a favorite stop with arrivals
 */
export const FavoriteStopCard: React.FC<FavoriteStopCardProps> = ({
  station,
  stop,
  className
}) => {
  const [currentTime, setCurrentTime] = React.useState<Date>(new Date());
  
  // Update current time every 15 seconds instead of 60 seconds
  React.useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentTime(new Date());
    }, 15000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  // Fetch arrivals for this stop
  const {
    data: stopArrivals,
    isLoading,
    isError,
  } = useStopArrivals(stop.stopId);
  
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
      ) : !stopArrivals?.arrivals?.length ? (
        <div className="text-center py-2">
          <p className="text-sm text-muted-foreground">No upcoming arrivals</p>
        </div>
      ) : (
        <div className="space-y-2">
          {stopArrivals.arrivals.slice(0, 2).map((arrival, idx) => (
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