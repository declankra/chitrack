// src/app/api/cta/arrivals/station/route.ts
// NOTE: the max number of mapids you can request is 4. meaning you can only request 4 stations at a time.
// i think it is only necessary to request 1 station at a time, so we can just make a request for each station.

import { NextRequest, NextResponse } from "next/server";
import { Arrival, ArrivalsApiResponse, StationArrivalsResponse } from "@/lib/types/cta";

export const dynamic = 'force-dynamic';

// Configuration constants
const CTA_API_KEY = process.env.CTA_TRAIN_API_KEY;
const CTA_API_TIMEOUT_MS = 5000; // 5 seconds timeout for CTA API
const MAX_RETRIES = 2; // Maximum number of retries for CTA API
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
 * Fetch fresh arrival data directly from CTA API for given station IDs
 * @param stationIds Array of CTA station IDs (mapids)
 * @returns Processed arrival data
 */
async function fetchFreshData(stationIds: string[]): Promise<StationArrivalsResponse[]> {
  console.log('Fetching fresh data from CTA API for stations:', stationIds);

  if (!CTA_API_KEY) {
    throw new Error("CTA API key not configured.");
  }

  // Construct URL for multiple stations (max 4)
  const ctaUrl = `https://lapi.transitchicago.com/api/1.0/ttarrivals.aspx?key=${CTA_API_KEY}&mapid=${stationIds.join(',')}&outputType=JSON`;

  try {
    const ctaResponse = await fetchCtaApiWithRetry(ctaUrl);
    const rawData: ArrivalsApiResponse = await ctaResponse.json();

    // Check for CTA API-level errors
    if (rawData.ctatt.errCd !== "0") {
      console.error(
        "CTA API Error:",
        rawData.ctatt.errNm,
        "(Code:",
        rawData.ctatt.errCd,
        ")"
      );
      throw new Error(`CTA API Error: ${rawData.ctatt.errNm}`);
    }

    // Process the arrivals
    const result = processArrivals(rawData.ctatt.eta || []);
    console.log(`Successfully fetched and processed data for ${stationIds.length} stations.`);
    return result;

  } catch (error) {
    console.error(`Failed to fetch or process CTA data for stations ${stationIds.join(',')}:`, error);
    // In case of error, return empty array or handle as needed
    return []; 
  }
}

/**
 * GET handler for /api/cta/arrivals/station
 * Fetches arrival data directly from CTA API for requested stations.
 *
 * Usage: GET /api/cta/arrivals/station?mapids=40380,41450
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mapidsParam = searchParams.get("mapids");

    if (!mapidsParam) {
      return NextResponse.json(
        { error: "Missing required parameter: mapids" },
        { status: 400 }
      );
    }

    // Split and validate mapids (basic validation)
    const stationIds = mapidsParam.split(',').filter(id => id.trim() !== '');
    if (stationIds.length === 0) {
      return NextResponse.json(
        { error: "Invalid mapids parameter: must contain at least one ID" },
        { status: 400 }
      );
    }
    
    // Limit the number of stations per request (CTA limit is around 4-5)
    if (stationIds.length > 4) {
      return NextResponse.json(
        { error: "Too many station IDs requested. Maximum is 4 per request." },
        { status: 400 }
      );
    }

    console.log(`API call for station arrivals: ${stationIds.join(',')}`);
    
    // Directly fetch fresh data
    const arrivalData = await fetchFreshData(stationIds);

    // Return the fresh data
    return NextResponse.json(arrivalData);

  } catch (error: any) {
    console.error("Error in station arrivals API route:", error);
    return NextResponse.json(
      { error: "Server error fetching arrival data.", details: error.message },
      { status: 500 }
    );
  }
}