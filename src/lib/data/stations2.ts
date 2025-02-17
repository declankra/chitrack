/**
 * station.ts
 *
 * Purpose:
 * - Provide TypeScript types/interfaces for CTA stations, stops, and the CTA Train Tracker API responses.
 * - Demonstrate a "dynamic" approach to loading station metadata (stops, station names) from a local/remote source.
 * - Illustrate how to fetch arrival data (up to next 3 arrivals, for example) in typed form.
 *
 * Instructions:
 * 1. Replace the placeholder functions for caching and fetching station data with your actual implementations.
 * 2. Use these interfaces to ensure type safety when calling CTA endpoints or processing their responses.
 */

import redis from '../redis';

///////////////////////////////
//        INTERFACES
///////////////////////////////

/**
 * High-level station entity (the "parent station").
 * CTA "mapid" or "staId" is the 4xxxx range identifying the entire station.
 */
export interface Station {
    /** Parent Station ID (e.g., 40360 for Southport) */
    stationId: string;
    /** Human-friendly station name (e.g. "Southport") */
    stationName: string;
    /** Collection of stops (one per platform or direction) */
    stops: StationStop[];
    /** Optional lat/lon for mapping the station center. */
    lat?: number;
    lon?: number;
  }
  
  /**
   * Represents a single platform or direction within the station.
   * CTA "stpid" is the 3xxxx range.
   */
  export interface StationStop {
    /** Stop ID (e.g., 30070 for Southport inbound) */
    stopId: string;
    /** Direction or platform description (e.g. "Service toward Loop") */
    directionName?: string;
    /** Parent station ID reference */
    parentStationId: string;
    /** Optional lat/lon for the specific platform */
    lat?: number;
    lon?: number;
  }
  
  /**
   * Typical structure of an arrival (ETA) from the Arrivals API.
   * Found in `ctatt.eta[]`.
   */
  export interface ArrivalEta {
    staId: string;   // Parent station ID (4xxxx)
    stpId: string;   // Stop ID (3xxxx)
    staNm: string;   // Station Name
    stpDe: string;   // Platform description (e.g., "Service toward Loop")
    rn: string;      // Train run number
    rt: string;      // Route (e.g. "Red", "Blue", "Brn", "Pink" etc.)
    destSt: string;  // Destination station ID
    destNm: string;  // Destination name (e.g. "Loop", "95th/Dan Ryan")
    trDr: string;    // Direction code (1,5) used internally
    prdt: string;    // Timestamp when prediction was generated
    arrT: string;    // Timestamp of predicted arrival
    isApp: string;   // "1" if approaching/very close
    isSch: string;   // "1" if based on schedule only
    isDly: string;   // "1" if delayed
    isFlt: string;   // "1" if a schedule fault was detected
    flags: string | null; // Not used currently
    lat: string;     // Train latitude
    lon: string;     // Train longitude
    heading: string; // Bearing in degrees (0-359)
  }
  
  /**
   * The root structure of the Arrivals API response when outputType=JSON.
   */
  export interface ArrivalsApiResponse {
    ctatt: {
      tmst: string;               // Time when response was generated
      errCd: string;              // Error code
      errNm: string | null;       // Error message if any
      eta: ArrivalEta[];          // Array of arrivals
    };
  }
  
  /**
   * Follow This Train API - Single train’s position plus an array of ETAs for each future stop.
   */
  export interface FollowApiResponse {
    ctatt: {
      tmst: string;           // Time of response
      errCd: string;
      errNm: string | null;
      position: {
        lat: string;
        lon: string;
        heading: string;
      };
      eta: ArrivalEta[];
    };
  }
  
  /**
   * Locations (Positions) API: For each route requested, you get an array of in-service trains.
   */
  export interface TrainLocation {
    rn: string;       // Run number
    destSt: string;   // Destination station ID
    destNm: string;   // Destination name
    trDr: string;     // Direction code
    nextStaId: string;   // Next station ID
    nextStpId: string;   // Next stop ID
    nextStaNm: string;   // Next station name
    prdt: string;        // Prediction generation time
    arrT: string;        // Arrival time
    isApp: string;       // Approaching?
    isDly: string;       // Delayed?
    flags: string | null;
    lat: string;         // Current lat
    lon: string;         // Current lon
    heading: string;     // Bearing
  }
  
  export interface LocationsApiResponse {
    ctatt: {
      tmst: string;       // Time of response
      errCd: string;
      errNm: string | null;
      // Usually "route" is an array, one object per route requested, each with a "train" array
      route: Array<{
        "@name": string;    // e.g. "red"
        train: TrainLocation[];
      }>;
    };
  }
  
  ///////////////////////////////
  //       EXAMPLE DATA
  ///////////////////////////////
  
  /**
   * A minimal example of a single station + stops, for demonstration.
   * In practice, you might fetch an entire list from GTFS or a static JSON file.
   */
  export const exampleStationData: Station[] = [
    {
      stationId: "40360", // Southport as parent station
      stationName: "Southport",
      lat: 41.943744,
      lon: -87.663619,
      stops: [
        {
          stopId: "30070",
          directionName: "Service toward Kimball",
          parentStationId: "40360",
          lat: 41.943744,
          lon: -87.663619,
        },
        {
          stopId: "30071",
          directionName: "Service toward Loop",
          parentStationId: "40360",
          lat: 41.943744,
          lon: -87.663619,
        },
      ],
    },
    // ... more stations
  ];
  
  ///////////////////////////////
  //     CACHING EXAMPLES
  ///////////////////////////////
  
  /**
   * Redis key for storing station data
   */
  const STATIONS_CACHE_KEY = 'CTA_STATIONS_DATA';
  const CACHE_TTL_SECONDS = 24 * 60 * 60; // 24 hours
  
  /**
   * Cache station data in Redis with 24-hour expiration
   */
  async function cacheStationData(stations: Station[]): Promise<void> {
    try {
      await redis.setex(STATIONS_CACHE_KEY, CACHE_TTL_SECONDS, JSON.stringify(stations));
      console.log(`Successfully cached ${stations.length} stations for 24 hours`);
    } catch (error) {
      console.error('Failed to cache station data:', error);
      // Don't throw - we want the app to continue even if caching fails
    }
  }
  
  /**
   * Retrieve cached station data from Redis
   */
  async function getCachedStations(): Promise<Station[] | null> {
    try {
      const cachedData = await redis.get(STATIONS_CACHE_KEY);
      if (!cachedData) return null;
      return JSON.parse(cachedData) as Station[];
    } catch (error) {
      console.error('Failed to retrieve cached station data:', error);
      return null;
    }
  }
  
  /**
   * Fetch fresh station data from our API endpoint
   */
  async function fetchFreshStationData(): Promise<Station[]> {
    const response = await fetch('/api/cta/stations');
    if (!response.ok) {
      throw new Error(`Failed to fetch station data: ${response.statusText}`);
    }
    return response.json();
  }
  
  ///////////////////////////////
  //   FETCHING STATION DATA
  ///////////////////////////////
  
  /**
   * Main function to retrieve station data, using cache when available
   * and falling back to fresh API fetch when needed.
   */
  export async function fetchStationsDynamic(): Promise<Station[]> {
    try {
      // First try to get from cache
      const cachedStations = await getCachedStations();
      if (cachedStations) {
        console.log('Retrieved stations from cache');
        return cachedStations;
      }

      // If not in cache, fetch fresh data
      console.log('Cache miss - fetching fresh station data');
      const stations = await fetchFreshStationData();
      
      // Cache the fresh data for next time
      await cacheStationData(stations);
      
      return stations;
    } catch (error) {
      console.error('Error fetching station data:', error);
      // If all else fails, return example data as fallback
      // In production, you might want to handle this differently
      return exampleStationData;
    }
  }
  
  ///////////////////////////////
  //  FETCHING ARRIVAL TIMES
  ///////////////////////////////
  
  /**
   * Example function to fetch arrival times for a given station (parent ID).
   * You might incorporate short-term caching (~30s) to reduce CTA hits.
   */
  export async function fetchArrivalsByStation(
    stationId: string,
    apiKey: string,
    maxResults = 3
  ): Promise<ArrivalEta[]> {
    const url = new URL("http://lapi.transitchicago.com/api/1.0/ttarrivals.aspx");
    url.searchParams.set("key", apiKey);
    url.searchParams.set("mapid", stationId);
    url.searchParams.set("max", String(maxResults));
    url.searchParams.set("outputType", "JSON");
  
    // If you already have short-term cache logic, check it here:
    // e.g. if (await isArrivalCacheFresh(stationId)) return getCachedArrivals(stationId);
  
    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Failed to fetch arrivals: ${response.statusText}`);
    }
  
    const data = (await response.json()) as ArrivalsApiResponse;
    if (data?.ctatt?.errCd !== "0") {
      throw new Error(
        `CTA API returned errCd=${data.ctatt.errCd}, errNm=${data.ctatt.errNm}`
      );
    }
  
    // Store these arrivals in a short-term cache
    // setArrivalsCache(stationId, data.ctatt.eta)
  
    return data.ctatt.eta;
  }
  
  /**
   * Example usage:
   *   const arrivals = await fetchArrivalsByStation("40360", "YOUR_CTA_API_KEY");
   *   console.log("Next arrivals at Southport:", arrivals);
   */
  
  