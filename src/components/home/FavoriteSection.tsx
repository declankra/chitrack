import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import FavoriteStopCard from './FavoriteStopCard';
import { formatRelativeTime } from '@/lib/utilities/timeUtils';
import { findStopsByIds } from '@/lib/utilities/findStop';
import { useMultipleStopArrivals } from '@/lib/hooks/useStopArrivals';
import { useRefreshAnimation } from '@/lib/hooks/useRefreshAnimation';
import type { Station } from '@/lib/types/cta';

interface FavoriteSectionProps {
  favoriteStopIds: string[];
  stations: Station[];
  className?: string;
}

/**
 * FavoriteSection component - displays a section with favorite stops
 */
export const FavoriteSection: React.FC<FavoriteSectionProps> = ({
  favoriteStopIds,
  stations,
  className
}) => {
  const [currentTime, setCurrentTime] = React.useState<Date>(new Date());
  
  // Get favorite stop details
  const favoriteStops = findStopsByIds(favoriteStopIds, stations);
  
  // Fetch arrivals for favorite stops
  const {
    refetch: refetchFavoriteStops,
    isLoading: favoriteStopsLoading,
    lastUpdated: favoriteStopsLastUpdated
  } = useMultipleStopArrivals(
    favoriteStopIds,
    { enabled: favoriteStopIds.length > 0 }
  );
  
  // Animation state for refresh button
  const { isAnimating, triggerAnimation } = useRefreshAnimation();
  
  // Update current time every minute
  React.useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  // Handle manual refresh
  const handleRefresh = () => {
    triggerAnimation();
    refetchFavoriteStops();
  };
  
  return (
    <Card className={className}>
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
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={favoriteStopsLoading}
                aria-label="Refresh all favorite stops"
              >
                <RefreshCw className={cn("h-4 w-4", { "animate-spin": favoriteStopsLoading || isAnimating })} />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {favoriteStops && favoriteStops.length > 0 ? (
          <div className="space-y-4">
            {favoriteStops.map(({ station, stop }) => (
              <FavoriteStopCard
                key={stop.stopId}
                station={station}
                stop={stop}
              />
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
  );
};

export default FavoriteSection;