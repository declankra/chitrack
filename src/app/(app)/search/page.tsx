// src/app/(app)/search/page.tsx
"use client"

import React, { useState, useCallback } from 'react';
import { useStations } from '@/lib/hooks/useStations';
import { Search } from 'lucide-react';
import { 
  Card, 
  CardHeader, 
  CardContent, 
  CardTitle 
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { 
  RouteColor, 
  Station, 
  SimpleStation, 
  SimpleStop, 
  SimpleArrival 
} from '@/lib/types/cta';

// Colors for different train routes
const ROUTE_COLORS = {
  Red: 'bg-red-600',
  Blue: 'bg-blue-600',
  Brn: 'bg-amber-800',
  G: 'bg-green-600',
  Org: 'bg-orange-500',
  P: 'bg-purple-600',
  Pink: 'bg-pink-500',
  Y: 'bg-yellow-500'
} as const;

// Helper to format arrival time
const formatArrival = (arrivalTime: string) => {
  const arrival = new Date(arrivalTime);
  const now = new Date();
  const minutesUntil = Math.round((arrival.getTime() - now.getTime()) / 60000);
  
  const timeString = arrival.toLocaleTimeString([], { 
    hour: 'numeric', 
    minute: '2-digit'
  });
  
  if (minutesUntil <= 0) return `Due (${timeString})`;
  return `${minutesUntil} min (${timeString})`;
};

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [arrivals, setArrivals] = useState<SimpleStation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { data: stations = [] } = useStations();
  
  // Filter stations based on search query
  const filteredStations = stations.filter(station =>
    station.stationName.toLowerCase().includes(query.toLowerCase())
  );

  // Fetch arrivals for selected station
  const fetchArrivals = useCallback(async (stationId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/cta/arrivals/station?stations=${stationId}`);
      const data = await response.json();
      setArrivals(data);
    } catch (error) {
      console.error('Error fetching arrivals:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle station selection
  const handleStationSelect = (station: Station) => {
    setSelectedStation(station);
    fetchArrivals(station.stationId);
    setQuery(''); // Clear search
  };

  return (
    <div className="flex flex-col space-y-4 h-full">
      {/* Initial state with centered heading */}
      {!selectedStation && (
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">Find Your Station</h1>
          <p className="text-sm text-muted-foreground">
            Search for any CTA train station to see upcoming arrivals
          </p>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Start typing station name..."
          className="w-full h-12 pl-10 pr-4 rounded-lg border border-input bg-background text-foreground"
        />
      </div>

      {/* Search Results */}
      {query && !selectedStation && (
        <Card className="mt-2">
          <CardContent className="p-0">
            <ul className="divide-y divide-border">
              {filteredStations.map((station) => (
                <li
                  key={station.stationId}
                  onClick={() => handleStationSelect(station)}
                  className="p-4 hover:bg-accent cursor-pointer transition-colors"
                >
                  <div className="font-medium">{station.stationName}</div>
                  <div className="text-sm text-muted-foreground">
                    {station.stops.map(stop => stop.directionName).join(' • ')}
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Arrival Board */}
      {selectedStation && (
        <Card className="flex-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-bold">
              {selectedStation.stationName}
            </CardTitle>
            <button
              onClick={() => setSelectedStation(null)}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Change Station
            </button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
              </div>
            ) : (
              arrivals.map((stationData) => (
                <div key={stationData.stationId} className="space-y-4">
                  {stationData.stops.map((stop: SimpleStop) => (
                    <div key={stop.stopId} className="space-y-2">
                      <h3 className="text-sm font-medium text-muted-foreground">
                        {stop.stopName}
                      </h3>
                      {stop.arrivals.length > 0 ? (
                        <div className="space-y-2">
                          {stop.arrivals.map((arrival: SimpleArrival, idx: number) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-3 rounded-md bg-accent/50"
                            >
                              <div className="flex items-center gap-2">
                                <div 
                                  className={cn(
                                    "w-3 h-3 rounded-full",
                                    ROUTE_COLORS[arrival.rt as RouteColor] || 'bg-gray-600'
                                  )} 
                                />
                                <span className="font-medium">
                                  {arrival.destNm}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                {arrival.isDly === "1" && (
                                  <span className="text-destructive font-medium">
                                    Delayed
                                  </span>
                                )}
                                <span className="font-medium">
                                  {formatArrival(arrival.arrT)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground py-2">
                          No upcoming arrivals
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}