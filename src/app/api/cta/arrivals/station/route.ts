// src/app/api/cta/arrivals/station/route.ts
// NOTE: the max number of mapids you can request is 4. meaning you can only request 4 stations at a time.
// i think it is only necessary to request 1 station at a time, so we can just make a request for each station.

import { NextRequest, NextResponse } from "next/server";
import redis from "@/lib/redis";
import { Arrival, ArrivalsApiResponse, StationArrivalsResponse } from "@/lib/types/cta";

export const dynamic = 'force-dynamic';

// Configuration constants
const CTA_API_KEY = process.env.CTA_TRAIN_API_KEY;
const CACHE_TTL_SECONDS = 30; // 30 seconds TTL for fresh cache
const STALE_TTL_SECONDS = 30; // Reduced from 60 seconds to 30 seconds for backup
const CTA_API_TIMEOUT_MS = 5000; // 5 seconds timeout for CTA API
const MAX_RETRIES = 2; // Maximum number of retries for CTA API
const THROTTLE_MS = 10000; // 10 seconds minimum between full refreshes
const MAX_PAST_MINUTES = 2; // 2 minutes in the past to still show an arrival
const TIME_OFFSET_MS = 5000; // Adjustable time offset to correct for server/CTA time differences

/**
 * Helper to parse "YYYYMMDD HH:mm:ss" and return JS Date timestamp.
 * If parsing fails, returns Infinity so sorting still works.
 */
function parseArrivalTime(ctaTime: string): number {
  try {
    // Check if the string is in ISO 8601 format (contains 'T' and possibly 'Z')
    if (ctaTime.includes('T')) {
      const date = new Date(ctaTime);
      if (!isNaN(date.getTime())) {
        return date.getTime();
      }
    }
    
    // Handle CTA format "YYYYMMDD HH:mm:ss"
    const [datePart, timePart] = ctaTime.split(" ");
    if (!datePart || !timePart) return Infinity;
    const year = +datePart.slice(0, 4);
    const month = +datePart.slice(4, 6) - 1; // zero-based
    const day = +datePart.slice(6, 8);

    const [hour, minute, second] = timePart.split(":").map((x) => +x);
    const parsedDate = new Date(year, month, day, hour, minute, second);
    if (Number.isNaN(parsedDate.getTime())) return Infinity;
    return parsedDate.getTime();
  } catch (error) {
    console.error("Error parsing CTA date:", error);
    return Infinity;
  }
}

/**
 * Checks if an arrival time is not too far in the past
 * @param arrivalTime CTA arrival time string
 * @returns boolean indicating if arrival should be included
 */
function isRelevantArrival(arrivalTime: string): boolean {
  const timestamp = parseArrivalTime(arrivalTime);
  if (timestamp === Infinity) return true; // If we can't parse, include it
  
  const now = Date.now() + TIME_OFFSET_MS; // Apply time offset correction
  const diffMs = timestamp - now;
  const diffMinutes = diffMs / 60000;
  
  // Debug logging to help diagnose time-related issues
  const isRelevant = diffMinutes > -MAX_PAST_MINUTES;
  
  // Include if it's in the future or within MAX_PAST_MINUTES of the past
  return isRelevant;
}

/**
 * Fetch data from CTA API with timeout and retry logic
 */
async function fetchCtaApiWithRetry(url: string, retryCount = 0): Promise<Response> {
  try {
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CTA_API_TIMEOUT_MS);
    
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      // If response is not ok and we haven't exceeded max retries, retry
      if (retryCount < MAX_RETRIES) {
        console.log(`CTA API returned ${response.status}, retrying (${retryCount + 1}/${MAX_RETRIES})...`);
        return fetchCtaApiWithRetry(url, retryCount + 1);
      }
      console.error(`CTA API error after ${retryCount} retries: Status ${response.status}`);
      throw new Error(`Failed to fetch data from CTA API: HTTP ${response.status}`);
    }
    
    return response;
  } catch (error: any) {
    // If we have retries left and it's a timeout or network error, retry
    if (retryCount < MAX_RETRIES && 
        (error.name === 'AbortError' || error.name === 'TypeError' || error.message?.includes('network'))) {
      console.log(`CTA API request failed with ${error.message}, retrying (${retryCount + 1}/${MAX_RETRIES})...`);
      return fetchCtaApiWithRetry(url, retryCount + 1);
    }
    
    // Otherwise, rethrow
    console.error(`CTA API fetch error after ${retryCount} retries:`, error);
    throw error;
  }
}

/**
 * Process raw arrivals data into grouped station format
 */
function processArrivals(rawArrivals: Arrival[]): StationArrivalsResponse[] {
  console.log(`Processing ${rawArrivals.length} raw arrivals`);
  
  // Filter arrivals that are not too far in the past
  const relevantArrivals = rawArrivals.filter(arr => isRelevantArrival(arr.arrT));
  console.log(`After filtering: ${relevantArrivals.length} relevant arrivals remain`);
  
  // Important: if filtering removed all arrivals, use all arrivals instead
  // This prevents empty results due to clock synchronization issues
  const arrivalsToProcess = relevantArrivals.length > 0 ? relevantArrivals : rawArrivals;
  if (relevantArrivals.length === 0 && rawArrivals.length > 0) {
    console.log(`Filtering removed all arrivals - using all ${rawArrivals.length} instead`);
  }
  
  // Group by station -> stops
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

  for (const arrival of arrivalsToProcess) {
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

  // Build final array with sorted arrivals
  return Object.values(stationMap).map((stationEntry) => {
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
}

/**
 * Handles Redis cache operations with better error handling
 */
class RedisCacheHandler {
  /**
   * Try to get data from Redis cache
   * @returns [data, timestamp, error] - data and timestamp if found, null and error otherwise
   */
  static async getCachedData(key: string): Promise<[any | null, number | null, Error | null]> {
    try {
      // Try to get the data with timestamp
      const cachedRaw = await redis.get(`${key}:data`);
      const timestampStr = await redis.get(`${key}:timestamp`);
      
      if (!cachedRaw) return [null, null, null]; // Cache miss, not an error
      
      const timestamp = timestampStr ? parseInt(timestampStr) : null;
      return [JSON.parse(cachedRaw), timestamp, null];
    } catch (err) {
      console.warn(`Redis get error for key ${key}:`, err);
      return [null, null, err as Error];
    }
  }

  /**
   * Check if cached data is fresh enough
   */
  static isCacheFresh(timestamp: number | null): boolean {
    if (!timestamp) return false;
    
    const ageMs = Date.now() - timestamp;
    return ageMs < CACHE_TTL_SECONDS * 1000;
  }

  /**
   * Check if cached data is too stale to use
   */
  static isCacheTooStale(timestamp: number | null): boolean {
    if (!timestamp) return true;
    
    const ageMs = Date.now() - timestamp;
    return ageMs > STALE_TTL_SECONDS * 1000;
  }

  /**
   * Cache data in Redis with better error handling
   */
  static async cacheData(key: string, data: any): Promise<void> {
    try {
      const timestamp = Date.now();
      const pipeline = redis.pipeline();
      
      pipeline.set(`${key}:data`, JSON.stringify(data), "EX", STALE_TTL_SECONDS);
      pipeline.set(`${key}:timestamp`, timestamp.toString(), "EX", STALE_TTL_SECONDS);
      
      await pipeline.exec();
      console.log(`Successfully cached data for key ${key}`);
    } catch (err) {
      // Log but don't fail the request
      console.warn(`Redis caching failed for key ${key}:`, err);
    }
  }
}

/**
 * Fetch fresh data from CTA API and cache it
 * This is separated to allow for background refresh
 */
async function fetchFreshData(stationIds: string[], cacheKey: string): Promise<StationArrivalsResponse[]> {
  // Build CTA request for all stations using multiple &mapid=
  const baseUrl = "https://lapi.transitchicago.com/api/1.0/ttarrivals.aspx";
  const urlParams = new URLSearchParams({
    key: CTA_API_KEY!,
    outputType: "JSON",
    // Request a generous number of arrivals as multiple stops might be returned
    max: "1000",
  });
  
  stationIds.forEach((id) => {
    urlParams.append("mapid", id);
  });

  const ctaUrl = `${baseUrl}?${urlParams.toString()}`;
  console.log(`Requesting fresh data from CTA API for stations: ${stationIds.join(",")}`);
  
  try {
    // Fetch with retry and timeout
    const ctaResponse = await fetchCtaApiWithRetry(ctaUrl);
    const data = await ctaResponse.json();
    
    if (!data?.ctatt?.eta) {
      console.error("CTA API did not return arrivals (eta):", data);
      throw new Error("CTA API did not return arrivals data. Possibly an error.");
    }

    const rawArrivals: Arrival[] = data.ctatt.eta;
    console.log(`CTA API returned ${rawArrivals.length} raw arrivals for stations ${stationIds.join(",")}`);
    
    const result = processArrivals(rawArrivals);
    
    // Cache the results
    await RedisCacheHandler.cacheData(cacheKey, result);
    
    console.log(`Successfully processed and cached ${rawArrivals.length} arrivals into ${result.length} stations`);
    return result;
  } catch (error) {
    console.error(`Failed to fetch data from CTA API for ${cacheKey}:`, error);
    throw error;
  }
}

/**
 * GET /api/cta/arrivals/stations?stations=40360,40380,...
 *
 * 1. Accepts a comma-separated list of station IDs in the query string
 * 2. Builds a single CTA Arrivals request with multiple &mapid=...
 * 3. Groups results by station, then by stpId under that station
 * 4. Returns up to 3 arrivals per stop ID in ascending arrT order
 * 5. Implements stale-while-revalidate caching via Redis
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  let stationsParam: string | null = null;
  
  try {
    if (!CTA_API_KEY) {
      return NextResponse.json(
        { error: "CTA_TRAIN_API_KEY not set in environment." },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    stationsParam = searchParams.get("stations");
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

    // Try to get from cache
    let [cachedData, cacheTimestamp, cacheError] = await RedisCacheHandler.getCachedData(cacheKey);
    let isFreshData = false;
    
    // Get request-specific headers to check for refresh behaviors
    const forceRefresh = request.headers.get('x-force-refresh') === 'true';
    
    // Check if the last request was too recent (for throttling)
    const isThrottled = cacheTimestamp && ((Date.now() - cacheTimestamp) < THROTTLE_MS) && !forceRefresh;
    
    // Only fetch fresh data if:
    // 1. We have no cached data at all, OR
    // 2. Data is too stale (> 5 min), OR
    // 3. Data is not fresh (> 30s) AND we're not being throttled
    let shouldFetchFresh = !cachedData || 
                         RedisCacheHandler.isCacheTooStale(cacheTimestamp) || 
                         (!RedisCacheHandler.isCacheFresh(cacheTimestamp) && !isThrottled);
    
    // If we hit cache and it's not too stale, use it immediately
    if (cachedData && !RedisCacheHandler.isCacheTooStale(cacheTimestamp)) {
      const dataAge = cacheTimestamp ? (Date.now() - cacheTimestamp) / 1000 : 'unknown';
      console.log(`Using cached data for ${cacheKey}, age: ${dataAge} seconds`);
      
      // If data is fresh, mark it as fresh
      if (RedisCacheHandler.isCacheFresh(cacheTimestamp)) {
        isFreshData = true;
      }
      
      // For background refresh, we only do it if a specific parameter is set, to avoid
      // extra fetching when the client is using manual refresh mode
      const allowBackgroundRefresh = request.headers.get('x-allow-background') === 'true';
      if (!isFreshData && allowBackgroundRefresh) {
        console.log(`Cache hit but stale, initiating background refresh for ${cacheKey}`);
        // Use .catch to prevent background fetch from affecting main response
        fetchFreshData(stationIds, cacheKey).catch(err => 
          console.error(`Background refresh failed for ${cacheKey}:`, err)
        );
      }
      
      // Return cached data immediately
      return NextResponse.json(cachedData, {
        headers: {
          'X-Cache': 'HIT',
          'X-Cache-Age': cacheTimestamp ? `${(Date.now() - cacheTimestamp) / 1000}` : 'unknown',
          'X-Cache-Fresh': isFreshData ? 'true' : 'false'
        }
      });
    }

    // If we need fresh data and don't have usable cache, fetch it now
    console.log(`Cache miss or too stale for ${cacheKey}, fetching fresh data`);
    const result = await fetchFreshData(stationIds, cacheKey);
    
    const processingTime = Date.now() - startTime;
    console.log(`Total processing time: ${processingTime}ms for ${cacheKey}`);
    
    return NextResponse.json(result, {
      headers: {
        'X-Cache': 'MISS',
        'X-Processing-Time': `${processingTime}`
      }
    });
  } catch (error: any) {
    console.error("Error in Station Arrivals API route:", error);
    
    return NextResponse.json(
      { 
        error: "Server error fetching station arrivals.", 
        details: error?.message || "Unknown error",
        station_ids: stationsParam || "none"
      },
      { status: 500 }
    );
  }
}