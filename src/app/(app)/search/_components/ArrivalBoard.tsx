// src/components/search/ArrivalBoard.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCcw } from 'lucide-react';
import type { Station, StationStop } from '@/lib/data/stations';

interface Arrival {
  destNm: string;
  arrT: string;
  rt: string;
  isApp: string;
  isDly: string;
  stpId: string;
}

interface ArrivalBoardProps {
  station: Station;
  onClose: () => void;
}

export default function ArrivalBoard({ station, onClose }: ArrivalBoardProps) {
  const [arrivals, setArrivals] = useState<Record<string, Arrival[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Function to fetch arrivals
  const fetchArrivals = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/cta?mapid=${station.staId}`);
      if (!response.ok) throw new Error('Failed to fetch arrivals');
      
      const data = await response.json();
      
      // Group arrivals by stop ID
      const groupedArrivals: Record<string, Arrival[]> = {};
      if (data.ctatt && data.ctatt.eta) {
        data.ctatt.eta.forEach((arrival: Arrival) => {
          const stopId = arrival.stpId;
          if (!groupedArrivals[stopId]) {
            groupedArrivals[stopId] = [];
          }
          groupedArrivals[stopId].push(arrival);
        });
      }
      
      setArrivals(groupedArrivals);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Fetch arrivals on mount and start refresh interval
  useEffect(() => {
    fetchArrivals();
    const interval = setInterval(fetchArrivals, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [station.staId]);

  // Calculate time until arrival
  const getTimeUntil = (arrivalTime: string) => {
    const arrival = new Date(arrivalTime);
    const now = new Date();
    const minutes = Math.round((arrival.getTime() - now.getTime()) / 60000);
    return minutes <= 0 ? 'Due' : `${minutes} min`;
  };

  // Get color class for route
  const getRouteColor = (route: string) => {
    const colors: Record<string, string> = {
      'Red': 'bg-red-600',
      'Blue': 'bg-blue-600',
      'Brn': 'bg-amber-800',
      'G': 'bg-green-600',
      'Org': 'bg-orange-500',
      'P': 'bg-purple-600',
      'Pink': 'bg-pink-500',
      'Y': 'bg-yellow-500'
    };
    return colors[route] || 'bg-gray-600';
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-bold">{station.staNm}</CardTitle>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={fetchArrivals}
            disabled={loading}
            className={loading ? 'animate-spin' : ''}
          >
            <RefreshCcw className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {error ? (
          <div className="text-destructive text-sm">{error}</div>
        ) : (
          <>
            {station.stops.map((stop) => {
              const stopArrivals = arrivals[stop.stpId] || [];
              return (
                <div key={stop.stpId} className="mb-4">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">
                    {stop.stpDe}
                  </h3>
                  {stopArrivals.length > 0 ? (
                    <div className="space-y-2">
                      {stopArrivals.slice(0, 3).map((arrival, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 rounded-md bg-accent/50"
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${getRouteColor(arrival.rt)}`} />
                            <span className="font-medium">{arrival.destNm}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {arrival.isDly === "1" && (
                              <span className="text-xs text-destructive">Delayed</span>
                            )}
                            <span className="font-medium">
                              {arrival.isApp === "1" ? "Due" : getTimeUntil(arrival.arrT)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      No upcoming arrivals
                    </div>
                  )}
                </div>
              );
            })}
            {lastUpdated && (
              <div className="text-xs text-muted-foreground mt-4">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}