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
import { useTime } from '@/lib/providers/TimeProvider';
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
  // Use the centralized time provider instead of a local timer
  const { currentTime } = useTime();
  
  // Get favorite stop details
  const favoriteStops = findStopsByIds(favoriteStopIds, stations);
  
  // Fetch arrivals for favorite stops
  const {
    refresh: refreshFavoriteStops,
    isLoading: favoriteStopsLoading,
    isRefetching: isRefetchingFavorites,
    lastUpdated: favoriteStopsLastUpdated
  } = useMultipleStopArrivals(
    favoriteStopIds,
    { enabled: favoriteStopIds.length > 0 }
  );
  
  // Animation state for refresh button
  const { isAnimating, triggerAnimation } = useRefreshAnimation();
  
  // Handle manual refresh
  const handleRefresh = () => {
    triggerAnimation();
    refreshFavoriteStops();
  };
  
  // If no favorites are set
  if (!favoriteStopIds.length || !favoriteStops.length) {
    return (
      <Card className={cn("", className)}>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Favorites</h2>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-muted-foreground mb-3">Save your favorite stops for quick access</p>
            <Button asChild variant="outline" size="sm">
              <Link href="/settings">Add Favorites</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Favorites</h2>
          </div>
          
          <div className="flex items-center gap-2">
            {favoriteStopsLastUpdated && (
              <span className="text-xs text-muted-foreground">
                {formatRelativeTime(favoriteStopsLastUpdated, currentTime)}
              </span>
            )}
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8" 
              onClick={handleRefresh}
              disabled={isRefetchingFavorites}
            >
              <RefreshCw 
                className={cn(
                  "h-4 w-4", 
                  (isAnimating || isRefetchingFavorites) && "animate-spin"
                )} 
              />
              <span className="sr-only">Refresh</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 gap-3">
          {favoriteStops.map((stop) => (
            <FavoriteStopCard 
              key={stop.stop.stopId} 
              station={stop.station} 
              stop={stop.stop} 
            />
          ))}
        </div>
        
        {/* Link to manage favorites - Added pb-16 for dock clearance */}
        <div className="mt-4 pb-16 flex justify-center">
          <Button asChild variant="outline" size="sm">
            <Link href="/settings">Manage Favorites</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default FavoriteSection;