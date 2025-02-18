// src/app/api/cta/arrivals/station/route.ts
// NOTE: the max number of mapids you can request is 4. meaning you can only request 4 stations at a time.
// i think it is only necessary to request 1 station at a time, so we can just make a request for each station.

import { NextRequest, NextResponse } from "next/server";
import redis from "@/lib/redis";

// CTA TRAIN API KEY from your environment
const CTA_API_KEY = process.env.CTA_TRAIN_API_KEY;

/**
 * Core CTA arrival interface (similar to ArrivalEta).
 */
interface Arrival {
  staId: string;   // Parent station ID (4xxxx)
  stpId: string;   // Stop (platform) ID (3xxxx)
  staNm: string;   // Station name
  stpDe: string;   // Platform description (e.g. "Service toward Loop")
  rn: string;      // Train run number
  rt: string;      // Route (Red, Blue, Brn, etc.)
  destNm: string;  // Destination name
  arrT: string;    // Predicted arrival time
  prdt: string;    // Timestamp when prediction was generated
  isApp: string;   // "1" if approaching
  isDly: string;   // "1" if delayed
  isSch: string;   // "1" if schedule-based (no live data)
}

/**
 * For each station, we group arrivals by stop ID, returning up to 3 arrivals in ascending order.
 */
interface StationData {
  stationId: string;
  stationName: string;
  stops: Array<{
    stopId: string;
    stopName: string;  // stpDe
    route: string;     // route code (Red, Blue, etc.)
    arrivals: Arrival[];
  }>;
}

/**
 * Helper to parse "YYYYMMDD HH:mm:ss" and return JS Date.
 * If parsing fails, returns Infinity so sorting still works.
 */
function parseArrivalTime(ctaTime: string): number {
  // Example ctaTime format: "20230419 08:35:34"
  const [datePart, timePart] = ctaTime.split(" ");
  if (!datePart || !timePart) return Infinity;
  const year = +datePart.slice(0, 4);
  const month = +datePart.slice(4, 6) - 1; // zero-based
  const day = +datePart.slice(6, 8);

  const [hour, minute, second] = timePart.split(":").map((x) => +x);
  const parsedDate = new Date(year, month, day, hour, minute, second);
  if (Number.isNaN(parsedDate.getTime())) return Infinity;
  return parsedDate.getTime();
}

/**
 * GET /api/cta/arrivals/stations?stations=40360,40380,...
 *
 * 1. Accepts a comma-separated list of station IDs in the query string
 * 2. Builds a single CTA Arrivals request with multiple &mapid=...
 * 3. Groups results by station, then by stpId under that station
 * 4. Returns up to 3 arrivals per stop ID in ascending arrT order
 * 5. Short-term caching (30s) via Redis
 */
export async function GET(request: NextRequest) {
  try {
    if (!CTA_API_KEY) {
      return NextResponse.json(
        { error: "CTA_TRAIN_API_KEY not set in environment." },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const stationsParam = searchParams.get("stations");
    if (!stationsParam) {
      return NextResponse.json(
        { error: "Please provide a comma-separated 'stations' query param." },
        { status: 400 }
      );
    }

    // Split stations, remove empty
    const stationIdsRaw = stationsParam.split(",");
    const stationIds = stationIdsRaw.map((s) => s.trim()).filter((s) => s !== "");
    if (stationIds.length === 0) {
      return NextResponse.json(
        { error: "No valid station IDs provided." },
        { status: 400 }
      );
    }

    // Sort IDs to keep consistent cache key
    stationIds.sort();
    const cacheKey = `stationArrivals_${stationIds.join("_")}`;

    // Check Redis
    try {
      const cachedData = await redis.get(cacheKey);
      if (cachedData) {
        return NextResponse.json(JSON.parse(cachedData));
      }
    } catch (err) {
      console.warn("Redis error, proceeding without cache:", err);
    }

    // Build CTA request for all stations using multiple &mapid=
    const baseUrl = "https://lapi.transitchicago.com/api/1.0/ttarrivals.aspx";
    const urlParams = new URLSearchParams({
      key: CTA_API_KEY,
      outputType: "JSON",
      // We'll request up to 12 arrivals overall, since multiple stops might be returned
      // but the CTA "max" param applies to the entire request, not per station.
      // We'll still do our own grouping/truncation below.
      max: "1000",
    });
    stationIds.forEach((id) => {
      urlParams.append("mapid", id);
    });

    const ctaUrl = `${baseUrl}?${urlParams.toString()}`;
    const ctaResponse = await fetch(ctaUrl);
    if (!ctaResponse.ok) {
      return NextResponse.json(
        {
          error: "Failed to fetch data from CTA Arrivals API",
          details: await ctaResponse.text(),
        },
        { status: 502 }
      );
    }

    const data = await ctaResponse.json();
    if (!data?.ctatt?.eta) {
      return NextResponse.json(
        {
          error: "CTA API did not return arrivals (eta). Possibly an error.",
          details: data,
        },
        { status: 500 }
      );
    }

    const rawArrivals: Arrival[] = data.ctatt.eta;

    // Group by station -> stops
    // structure: stationMap[staId] = { stationId, stationName, stops: { stpId -> { ... } } }
    const stationMap: Record<string, {
      stationId: string;
      stationName: string;
      stops: Record<string, {
        stopId: string;
        stopName: string;
        route: string;
        arrivals: Arrival[];
      }>;
    }> = {};

    for (const arrival of rawArrivals) {
      // Ensure station object
      if (!stationMap[arrival.staId]) {
        stationMap[arrival.staId] = {
          stationId: arrival.staId,
          stationName: arrival.staNm,
          stops: {},
        };
      }

      // Check if we already have a stop
      if (!stationMap[arrival.staId].stops[arrival.stpId]) {
        stationMap[arrival.staId].stops[arrival.stpId] = {
          stopId: arrival.stpId,
          stopName: arrival.stpDe,
          route: arrival.rt,
          arrivals: [],
        };
      }

      // Push arrival
      stationMap[arrival.staId].stops[arrival.stpId].arrivals.push(arrival);
    }

    // Now build final array
    const result: StationData[] = Object.values(stationMap).map((stationEntry) => {
      // For each stop, sort arrivals by arrT ascending, slice top 3
      const stopsArray = Object.values(stationEntry.stops).map((stopEntry) => {
        // Sort arrivals by their predicted arrival time
        stopEntry.arrivals.sort((a, b) => {
          const aTime = parseArrivalTime(a.arrT);
          const bTime = parseArrivalTime(b.arrT);
          return aTime - bTime; // ascending
        });
        // Keep only first 3
        stopEntry.arrivals = stopEntry.arrivals.slice(0, 3);

        return stopEntry;
      });

      return {
        stationId: stationEntry.stationId,
        stationName: stationEntry.stationName,
        stops: stopsArray,
      };
    });

    // Cache final result for 30s
    try {
      await redis.set(cacheKey, JSON.stringify(result), "EX", 30);
    } catch (cacheErr) {
      console.warn("Redis caching failed:", cacheErr);
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error in Station Arrivals API route:", error);
    return NextResponse.json(
      { error: "Server error.", details: error?.message },
      { status: 500 }
    );
  }
}