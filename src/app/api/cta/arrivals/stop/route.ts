// src/app/api/cta/arrivals/stop/route.ts
import { NextRequest, NextResponse } from "next/server"
import redis from "@/lib/redis"
import { Arrival, ArrivalsApiResponse, StopArrivalsResponse } from "@/lib/types/cta"

export const dynamic = 'force-dynamic';

// Configuration constants
const CTA_API_KEY = process.env.CTA_TRAIN_API_KEY
const CACHE_TTL_SECONDS = 15 // 15 seconds TTL for fresh cache (reduced from 30)
const STALE_TTL_SECONDS = 15 // 15 seconds for stale data (reduced from 30-60)
const CTA_API_TIMEOUT_MS = 5000 // 5 seconds timeout for CTA API
const MAX_RETRIES = 2 // Maximum number of retries for CTA API
const MAX_PAST_MINUTES = 2 // 2 minutes in the past to still show an arrival
const TIME_OFFSET_MS = 5000 // Adjustable time offset to correct for server/CTA time differences

/**
 * Helper to parse arrival time strings and return a numerical timestamp.
 * Handles both CTA format "YYYYMMDD HH:mm:ss" and ISO 8601 format "YYYY-MM-DDThh:mm:ss"
 * If parsing fails, returns Infinity so sorting still works.
 */
function parseArrivalTime(timeStr: string): number {
  try {
    // Check if the string is in ISO 8601 format (contains 'T' and possibly 'Z')
    if (timeStr.includes('T')) {
      const date = new Date(timeStr);
      if (!isNaN(date.getTime())) {
        return date.getTime();
      }
    }
    
    // Handle CTA format "YYYYMMDD HH:mm:ss"
    const [datePart, timePart] = timeStr.split(" ");
    if (!datePart || !timePart) return Infinity;
    
    const year = +datePart.slice(0, 4);
    const month = +datePart.slice(4, 6) - 1; // zero-based
    const day = +datePart.slice(6, 8);

    const [hour, minute, second] = timePart.split(":").map((x) => +x);
    const parsedDate = new Date(year, month, day, hour, minute, second);
    
    if (Number.isNaN(parsedDate.getTime())) return Infinity;
    return parsedDate.getTime();
  } catch (error) {
    console.warn("Error parsing arrival time:", timeStr, error);
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
  console.log(`Arrival time: ${arrivalTime}, diff minutes: ${diffMinutes.toFixed(2)}, relevant: ${isRelevant}`);
  
  // Include if it's in the future or within MAX_PAST_MINUTES of the past
  return isRelevant;
}

/**
 * Checks if there are any relevant arrivals in the array
 * If not, return all arrivals to avoid empty results
 */
function filterRelevantArrivals(arrivals: Arrival[]): Arrival[] {
  // First attempt to filter by our relevance criteria
  const relevantArrivals = arrivals.filter(arr => isRelevantArrival(arr.arrT));
  
  // If filtering removed ALL arrivals, return the original set
  // This prevents empty results due to clock synchronization issues
  if (relevantArrivals.length === 0 && arrivals.length > 0) {
    console.log(`Filtering removed all ${arrivals.length} arrivals - returning all instead`);
    return arrivals;
  }
  
  return relevantArrivals;
}

/**
 * Fetch data from CTA API with timeout and retry logic
 */
async function fetchCtaApiWithRetry(url: string, retryCount = 0): Promise<Response> {
  try {
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CTA_API_TIMEOUT_MS);
    
    const response = await fetch(url, { signal: controller.signal, cache: 'no-store' });
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
 * Handles Redis cache operations with better error handling
 */
class RedisCacheHandler {
  /**
   * Try to get data from Redis cache
   * @returns [data, timestamp, error] - data and timestamp if found, null and error otherwise
   */
  static async getCachedData(key: string): Promise<[any | null, number | null, Error | null]> {
    try {
      const result = await redis.hgetall(key);
      
      if (!result || !result.data) return [null, null, null];
      
      const timestamp = result.timestamp ? parseInt(result.timestamp) : null;
      return [JSON.parse(result.data), timestamp, null];
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
      
      // Store both data and timestamp in a single hash key
      await redis.hset(
        key,
        'data', JSON.stringify(data),
        'timestamp', timestamp.toString()
      );
      
      // Set expiration on the hash
      await redis.expire(key, CACHE_TTL_SECONDS);
      
      console.log(`Successfully cached data for key ${key}`);
    } catch (err) {
      console.warn(`Redis caching failed for key ${key}:`, err);
    }
  }
}

/**
 * Fetch fresh data from CTA API and cache it
 */
async function fetchFreshStopData(stopId: string, cacheKey: string): Promise<StopArrivalsResponse> {
  // Build CTA Arrivals request
  const baseUrl = "https://lapi.transitchicago.com/api/1.0/ttarrivals.aspx";
  const urlParams = new URLSearchParams({
    key: CTA_API_KEY!,
    outputType: "JSON",
    stpid: stopId,
    max: "10", // fetch up to 10 so we can filter down to 3 if we want
  });
  
  const ctaUrl = `${baseUrl}?${urlParams.toString()}`;
  // console.log(`Requesting fresh data from CTA API for stop: ${stopId}`);
  
  try {
    // Fetch with retry and timeout
    const ctaResponse = await fetchCtaApiWithRetry(ctaUrl);
    const data = await ctaResponse.json();
    
    if (!data?.ctatt?.eta) {
      console.error("CTA API did not return arrivals (eta):", data);
      throw new Error("CTA API did not return arrivals data. Possibly an error.");
    }

    const rawArrivals: Arrival[] = data.ctatt.eta;
    // console.log(`CTA API returned ${rawArrivals.length} raw arrivals for stop ${stopId}`);
    
    let result: StopArrivalsResponse;
    
    if (rawArrivals.length === 0) {
      // no arrivals returned
      result = {
        stopId,
        stopName: "",
        route: "",
        arrivals: [],
      };
    } else {
      // We assume all arrivals share the same stpId/stpDe if the CTA returned multiple
      const stpId = rawArrivals[0].stpId;
      const stpDe = rawArrivals[0].stpDe || ""; // Add fallback for empty stop description
      const route = rawArrivals[0].rt;

      // Filter out arrivals that are too far in the past
      // But make sure we don't end up with empty results
      const relevantArrivals = filterRelevantArrivals(rawArrivals);
      // console.log(`After filtering: ${relevantArrivals.length} relevant arrivals remain`);
      
      // Sort remaining arrivals by time ascending
      relevantArrivals.sort((a, b) => parseArrivalTime(a.arrT) - parseArrivalTime(b.arrT));

      // Take up to 3
      const arrivals = relevantArrivals.slice(0, 3);

      // final response object
      result = {
        stopId: stpId,
        stopName: stpDe,
        route,
        arrivals,
      };
    }
    
    // Cache the results
    await RedisCacheHandler.cacheData(cacheKey, result);
    
    // console.log(`Successfully processed and cached arrivals for stop ${stopId}`);
    return result;
  } catch (error) {
    console.error(`Failed to fetch data from CTA API for ${cacheKey}:`, error);
    throw error;
  }
}

/**
 * GET /api/cta/arrivals/stop?stopId=30070
 * - Returns up to 3 arrivals for a specific platform "stopId" (3xxxx)
 * - short-term caching (30s) via Redis
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  let stopId: string | null = null;
  
  try {
    if (!CTA_API_KEY) {
      return NextResponse.json(
        { error: "CTA_TRAIN_API_KEY not set in environment." },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    stopId = searchParams.get("stopId");
    if (!stopId) {
      return NextResponse.json(
        { error: "Please provide a 'stopId' query param (3xxxx)." },
        { status: 400 }
      );
    }

    const cacheKey = `arrivals_stop_${stopId}`;

    // Try to get from cache with timestamp validation
    let [cachedData, cacheTimestamp, cacheError] = await RedisCacheHandler.getCachedData(cacheKey);
    let isFreshData = false;
    
    // Get request-specific headers to check for refresh behaviors
    const forceRefresh = request.headers.get('x-force-refresh') === 'true';
    
    // Check if we have recently updated data (within last 30 seconds)
    const isCacheFresh = RedisCacheHandler.isCacheFresh(cacheTimestamp);
    
    // Only fetch fresh data if:
    // 1. We have no cached data at all, OR
    // 2. Data is too stale (> 1 min), OR
    // 3. Force refresh is requested, OR
    // 4. Data is not fresh (> 30s)
    let shouldFetchFresh = !cachedData || 
                         RedisCacheHandler.isCacheTooStale(cacheTimestamp) || 
                         forceRefresh ||
                         !isCacheFresh;
    
    // If we hit cache and it's not too stale, use it immediately
    if (cachedData && !RedisCacheHandler.isCacheTooStale(cacheTimestamp)) {
      const dataAge = cacheTimestamp ? (Date.now() - cacheTimestamp) / 1000 : 'unknown';
      // console.log(`Using cached data for ${cacheKey}, age: ${dataAge} seconds`);
      
      // If data is fresh, mark it as fresh
      if (isCacheFresh) {
        isFreshData = true;
      }
      
      // For background refresh, we only do it if a specific parameter is set
      const allowBackgroundRefresh = request.headers.get('x-allow-background') === 'true';
      if (!isFreshData && allowBackgroundRefresh && !forceRefresh) {
        // console.log(`Cache hit but stale, initiating background refresh for ${cacheKey}`);
        // Use .catch to prevent background fetch from affecting main response
        fetchFreshStopData(stopId, cacheKey).catch(err => 
          console.error(`Background refresh failed for ${cacheKey}:`, err)
        );
      }
      
      // Return cached data immediately
      return NextResponse.json(cachedData, {
        headers: {
          'X-Cache': 'HIT',
          'X-Cache-Age': cacheTimestamp ? `${(Date.now() - cacheTimestamp) / 1000}` : 'unknown',
          'X-Cache-Fresh': isFreshData ? 'true' : 'false',
          'Cache-Control': 'no-store'
        }
      });
    }

    // If we need fresh data and don't have usable cache, fetch it now
    // console.log(`Cache miss or too stale for ${cacheKey}, fetching fresh data`);
    const result = await fetchFreshStopData(stopId, cacheKey);
    
    const processingTime = Date.now() - startTime;
    // console.log(`Total processing time: ${processingTime}ms for ${cacheKey}`);
    
    return NextResponse.json(result, {
      headers: {
        'X-Cache': 'MISS',
        'X-Processing-Time': `${processingTime}`,
        'Cache-Control': 'no-store'
      }
    });
  } catch (error: any) {
    console.error("Error in Stop Arrivals API route:", error);
    
    return NextResponse.json(
      { 
        error: "Server error fetching stop arrivals.", 
        details: error?.message || "Unknown error",
        stop_id: stopId || "none"
      },
      { status: 500 }
    );
  }
}