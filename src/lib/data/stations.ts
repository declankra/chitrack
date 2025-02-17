/**
 * station.ts
 *
 * Purpose:
 * - Provide TypeScript types/interfaces for CTA stations, stops, and the CTA Train Tracker API responses.
 * - Define client-side functions for fetching and searching station data.
 */

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
 * Follow This Train API - Single train's position plus an array of ETAs for each future stop.
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
//  CLIENT-SIDE FUNCTIONS
///////////////////////////////

/**
 * Fetch fresh station data from our API endpoint
 */
export async function fetchStationsDynamic(): Promise<Station[]> {
    try {
        const response = await fetch('/api/cta/stations');
        if (!response.ok) {
            throw new Error(`Failed to fetch station data: ${response.statusText}`);
        }
        return response.json();
    } catch (error) {
        console.error('Error fetching station data:', error);
        throw error;
    }
}


/**
 * Fetch arrival times for a given station (parent ID).
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

    return data.ctatt.eta;
}





