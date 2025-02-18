// src/app/(app)/search/_components/ArrivalBoard.tsx
"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCcw } from 'lucide-react';
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

export default function ArrivalBoard({ 
  arrivals, 
  loading, 
  error, 
  lastUpdated, 
  onRefresh,
  stationName
}: ArrivalBoardProps) {
  return (
    <div className="flex-1 overflow-y-auto px-4 pb-24">
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="text-xl">
            {stationName}
          </CardTitle>
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
              {/* This station might have multiple stops - group arrivals by stops */}
              {stationInfo.stops.map((stop: any) => {
                // We want to group arrivals by route code
                const groupedByRoute: Record<string, Arrival[]> = {};
                stop.arrivals.forEach((arr: Arrival) => {
                  if (!groupedByRoute[arr.rt]) {
                    groupedByRoute[arr.rt] = [];
                  }
                  groupedByRoute[arr.rt].push(arr);
                });

                return (
                  <div key={stop.stopId} className="space-y-2">
                    <h3 className="text-sm font-semibold text-muted-foreground">
                      {stop.stopName}
                    </h3>
                    {Object.entries(groupedByRoute).map(([route, arrivalsArr]) => (
                      <div
                        key={route}
                        className="border rounded-md p-3 bg-accent/50"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div
                            className={cn(
                              "w-3 h-3 rounded-full",
                              ROUTE_COLORS[route as RouteColor] || "bg-gray-600"
                            )}
                          />
                          <span className="font-medium">{route} Line</span>
                        </div>
                        <div className="space-y-1">
                          {arrivalsArr.length > 0 ? (
                            arrivalsArr.map((arrObj, i) => (
                              <div key={i} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                  {arrObj.isDly === "1" && (
                                    <span className="text-destructive">
                                      Delayed
                                    </span>
                                  )}
                                  <span>{arrObj.destNm}</span>
                                </div>
                                <div className={cn(
                                  "font-medium",
                                  (arrObj.isApp === "1" || formatArrivalTime(arrObj).startsWith('Due')) && "text-destructive"
                                )}>
                                  {formatArrivalTime(arrObj)}
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              No upcoming arrivals
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
          {lastUpdated && (
            <p className="mt-4 text-xs text-muted-foreground">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}