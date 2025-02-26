// src/app/(app)/search/_components/ArrivalBoard.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCcw, AlertCircle, MapPin, ArrowRight } from 'lucide-react';
import { cn } from "@/lib/utils";
import type { RouteColor } from "@/lib/types/cta";
import { ROUTE_COLORS } from "@/lib/types/cta";

interface Arrival {
  rt: RouteColor;   // route code, e.g. "Red"
  destNm: string;   // destination name
  arrT: string;     // arrival time in CTA format
  isApp: string;    // '1' if approaching
  isDly: string;    // '1' if delayed
  stpDe: string;    // human-friendly direction
}

interface ArrivalBoardProps {
  arrivals: any[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  onRefresh: () => void;
  stationName: string;
}

/**
 * Format relative time in minutes
 */
function formatRelativeTime(date: Date | null, currentTime: Date): string {
  if (!date) return '';
  const diffMs = currentTime.getTime() - date.getTime();
  const diffMins = Math.round(diffMs / 60000);
  
  if (diffMins < 1) return 'just now';
  return `${diffMins}m ago`;
}

/**
 * Convert either a CTA arrival time string "YYYYMMDD HH:mm:ss" or ISO-8601 date string into a JS Date
 */
function parseCtaDate(ctaTime: string): Date | null {
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
}

/**
 * Helper to format arrival time as "Due (hh:mm AM/PM)" or "8 min (hh:mm AM/PM)"
 * If isApp === "1", returns "Due"
 */
function formatArrivalTime(arrival: Arrival, currentTime: Date) {
  const arrTime = parseCtaDate(arrival.arrT);

  if (!arrTime) {
    return "N/A";
  }

  // If isApp = "1", the train is approaching
  if (arrival.isApp === "1") {
    return `Due (${arrTime.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })})`;
  }

  const diffMs = arrTime.getTime() - currentTime.getTime();
  const diffMin = Math.round(diffMs / 60000);

  if (diffMin <= 0) {
    // Train should be here
    return `Due (${arrTime.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })})`;
  }

  const timeString = arrTime.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${diffMin} min (${timeString})`;
}

/**
 * Map route codes to full line names
 */
function getFullLineName(code: string): string {
  const lineNames: Record<string, string> = {
    'Org': 'Orange',
    'G': 'Green',
    'Brn': 'Brown',
    'Y': 'Yellow',
    'P': 'Purple',
  };
  return lineNames[code] || code;
}

/**
 * Normalize route codes from the API to match our RouteColor type
 */
function normalizeRouteColor(route: string): RouteColor {
  // Convert route to proper case to match RouteColor type
  const routeMap: Record<string, RouteColor> = {
    'RED': 'Red',
    'BLUE': 'Blue',
    'BRN': 'Brn',
    'G': 'G',
    'ORG': 'Org',
    'P': 'P',
    'PINK': 'Pink',
    'Y': 'Y'
  };
  
  return routeMap[route.toUpperCase()] || 'Red'; // Default to Red if unknown
}

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

  // Set up a timer to update the display every minute
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

  // Process arrivals data to group by route first
  const routeGroupedArrivals = React.useMemo(() => {
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
            onClick={onRefresh}
            disabled={loading}
            className={loading ? "animate-spin" : ""}
            aria-label="Refresh arrivals"
          >
            <RefreshCcw className="w-4 h-4" />
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
          <Button variant="outline" size="sm" onClick={onRefresh} className="mt-2">
            <RefreshCcw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      )}
      
      {/* Route-Grouped Arrivals */}
      <div className="space-y-4 px-4">
        {routeGroupedArrivals.map(({ route, arrivals, stopNames }) => {
          const normalizedRoute = normalizeRouteColor(route);
          const routeColorClass = ROUTE_COLORS[normalizedRoute] || "bg-gray-600";
          const routeName = getFullLineName(route);
          
          return (
            <Card key={route} className="overflow-hidden">
                              {/* Route Header */}
              <div className={cn(
                "px-4 py-3 flex items-center border-b",
                routeColorClass.replace('bg-', 'bg-opacity-10 bg-')
              )}>
                <div className="flex items-center gap-2">
                  <div className={cn("w-3 h-3 rounded-full", routeColorClass)} />
                  <span className="font-semibold">{routeName} Line</span>
                </div>
              </div>
              
              {/* Arrivals List */}
              <CardContent className="p-0 divide-y">
                {arrivals.length > 0 ? (
                  arrivals.map((arrival, idx) => {
                    const isApproaching = arrival.isApp === "1";
                    const isDelayed = arrival.isDly === "1";
                    const arrivalText = formatArrivalTime(arrival, currentTime);
                    const isDue = isApproaching || arrivalText.startsWith('Due');
                    
                    // Extract just the minutes for prominent display
                    const minutesMatch = arrivalText.match(/^(\d+) min/);
                    const minutes = minutesMatch ? minutesMatch[1] : null;
                    
                    // Extract the time for secondary display
                    const timeMatch = arrivalText.match(/\((.+)\)/);
                    const time = timeMatch ? timeMatch[1] : null;
                    
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
                        <div className="flex flex-col items-end">
                          {isDelayed && (
                            <span className="text-xs font-semibold text-amber-600 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" /> Delayed
                            </span>
                          )}
                          
                          {isDue ? (
                            <span className="text-lg font-bold text-destructive">Due</span>
                          ) : minutes ? (
                            <span className="text-lg font-bold">{minutes}<span className="text-sm font-normal text-muted-foreground ml-1">min</span></span>
                          ) : (
                            <span className="text-lg font-bold">--</span>
                          )}
                          
                          
                          {time && (
                            <span className="text-xs text-muted-foreground">
                              {time}
                            </span>
                          )}
                        </div>
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