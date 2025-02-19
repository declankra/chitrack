// src/app/(app)/search/_components/ArrivalBoard.tsx
"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCcw, Clock } from 'lucide-react';
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
function formatRelativeTime(date: Date | null): string {
  if (!date) return '';
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.round(diffMs / 60000);
  
  if (diffMins < 1) return 'just now';
  return `${diffMins}m ago`;
}

/**
 * Convert either a CTA arrival time string "YYYYMMDD HH:mm:ss" or ISO-8601 date string into a JS Date
 */
function parseCtaDate(ctaTime: string): Date | null {
  console.log('Parsing CTA date:', { ctaTime });
  
  // Handle ISO-8601 format (e.g. "2025-02-18T12:43:48")
  if (ctaTime.includes('T')) {
    const d = new Date(ctaTime);
    console.log('Parsed ISO date result:', {
      input: ctaTime,
      parsed: d.toISOString(),
      isValid: !Number.isNaN(d.getTime())
    });
    return Number.isNaN(d.getTime()) ? null : d;
  }
  
  // Handle CTA custom format ("YYYYMMDD HH:mm:ss")
  if (!ctaTime || !ctaTime.includes(" ")) {
    console.log('Invalid CTA date format - missing space separator');
    return null;
  }
  
  const [datePart, timePart] = ctaTime.split(" ");
  if (!datePart || !timePart) {
    console.log('Invalid CTA date format - missing date or time part');
    return null;
  }
  
  const year = +datePart.slice(0, 4);
  const month = +datePart.slice(4, 6) - 1;
  const day = +datePart.slice(6, 8);
  const [hour, minute, second] = timePart.split(":").map(Number);

  const d = new Date(year, month, day, hour, minute, second);
  console.log('Parsed CTA custom format result:', {
    input: ctaTime,
    parsed: d.toISOString(),
    isValid: !Number.isNaN(d.getTime())
  });
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Helper to format arrival time as "Due (hh:mm AM/PM)" or "8 min (hh:mm AM/PM)"
 * If isApp === "1", returns "Due"
 */
function formatArrivalTime(arrival: Arrival) {
  const now = new Date();
  const arrTime = parseCtaDate(arrival.arrT);

  if (!arrTime) {
    return "N/A";
  }

  // If isApp = "1", the train is approaching
  if (arrival.isApp === "1") {
    return `Due (${arrTime.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })})`;
  }

  const diffMs = arrTime.getTime() - now.getTime();
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
  // Add debug logging for ROUTE_COLORS
  console.log("ROUTE_COLORS:", ROUTE_COLORS);

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-24">
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-xl font-bold text-center">
            {stationName}
          </CardTitle>
          <div className="flex items-center justify-center gap-4">
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
            {lastUpdated && (
              <div className="text-xs text-muted-foreground">
                Updated {formatRelativeTime(lastUpdated)}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <p className="text-sm text-destructive mb-2">{error}</p>
          )}
          {arrivals.length === 0 && !error && (
            <p className="text-sm text-muted-foreground">
              Loading arrivals or no data...
            </p>
          )}
          {arrivals.map((stationInfo: any) => (
            <div key={stationInfo.stationId} className="space-y-6">
              {stationInfo.stops.map((stop: any) => {
                const groupedByRoute: Record<string, Arrival[]> = {};
                stop.arrivals.forEach((arr: Arrival) => {
                  if (!groupedByRoute[arr.rt]) {
                    groupedByRoute[arr.rt] = [];
                  }
                  groupedByRoute[arr.rt].push(arr);
                });

                return (
                  <div key={stop.stopId} className="space-y-4">
                    <h3 className="text-base font-semibold">
                      {stop.stopName}
                    </h3>
                    {Object.entries(groupedByRoute).map(([route, arrivalsArr]) => {
                      const normalizedRoute = normalizeRouteColor(route);
                      
                      // Add debug logging for route color mapping
                      console.log("Original Route:", route);
                      console.log("Normalized Route:", normalizedRoute);
                      console.log("Mapped Color:", ROUTE_COLORS[normalizedRoute]);
                      
                      // Add debug logging for computed class
                      const computedClass = ROUTE_COLORS[normalizedRoute]?.replace('bg-', 'bg-opacity-10 bg-') || "bg-gray-100";
                      console.log("Computed class:", computedClass);

                      return (
                        <div
                          key={route}
                          className="border rounded-lg overflow-hidden bg-accent/50"
                        >
                          <div 
                            className={cn(
                              "px-3 py-2 flex items-center gap-2",
                              computedClass
                            )}
                          >
                            <div
                              className={cn(
                                "w-2 h-2 rounded-full",
                                ROUTE_COLORS[normalizedRoute] || "bg-gray-600"
                              )}
                            />
                            <span className="font-medium text-sm">{getFullLineName(route)}</span>
                          </div>
                          <div className="divide-y">
                            {arrivalsArr.length > 0 ? (
                              arrivalsArr.map((arrObj, i) => (
                                <div 
                                  key={i} 
                                  className="px-3 py-2 flex items-center justify-between"
                                >
                                  <div className="flex flex-col">
                                    <span className="font-medium text-sm">
                                      {arrObj.destNm}
                                    </span>
                                    {arrObj.isDly === "1" && (
                                      <span className="text-xs text-destructive font-medium">
                                        Delayed
                                      </span>
                                    )}
                                  </div>
                                  <div className={cn(
                                    "text-sm tabular-nums",
                                    (arrObj.isApp === "1" || formatArrivalTime(arrObj).startsWith('Due')) 
                                      ? "text-destructive font-bold"
                                      : "font-medium"
                                  )}>
                                    {formatArrivalTime(arrObj)}
                                  </div>
                                </div>
                              ))
                            ) : (
                              <p className="px-3 py-2 text-sm text-muted-foreground">
                                No upcoming arrivals
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}