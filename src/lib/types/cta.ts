/**
 * CTA Transit Types
 * Centralized type definitions for CTA transit data structures: stations, stops, the CTA Train Tracker API responses, route types, and frontend-specific types
 */

///////////////////////////////
//        Route Types        
///////////////////////////////

/**
 * Valid CTA train route colors
 */
export type RouteColor = 'Red' | 'Blue' | 'Brn' | 'G' | 'Org' | 'P' | 'Pink' | 'Y';

/**
 * Tailwind CSS background color classes for each route
 */
export const ROUTE_COLORS: Record<RouteColor, string> = {
  Red: "bg-red-600",
  Blue: "bg-blue-600",
  Brn: "bg-amber-800",
  G: "bg-green-600",
  Org: "bg-orange-500",
  P: "bg-purple-600",
  Pink: "bg-pink-500",
  Y: "bg-yellow-500",
} as const;

///////////////////////////////
//     Core Station Types    
///////////////////////////////

/**
 * High-level station entity (the "parent station").
 * CTA "mapid" or "staId" is in the 4xxxx range identifying the entire station.
 * 
 * Represents a CTA Station, which can have multiple platform stops.
 * Example:
 *  - stationId: "40360" (Southport)
 *  - stationName: "Southport"
 *  - lat: 41.943744
 *  - lon: -87.663619
 *  - stops: array of StationStop objects (each representing a direction/platform)
 */
export interface Station {
    /** Parent Station ID (e.g., 40360 for Southport) */
    stationId: string;
    /** Human-friendly station name (e.g. "Southport") */
    stationName: string;
    /** The array of platform-specific stops (3xxxx IDs) */
    stops: StationStop[];
    /** Optional lat/lon for mapping the station center */
    lat?: number;
    lon?: number;
}

/**
 * Represents an individual platform/direction (stop) within a station.
 * CTA calls these "Stop IDs" "stpid" (3xxxx). For example:
 *   - stopId: "30070" (Service toward Kimball)
 *   - directionName: "Service toward Kimball" or "Service toward Loop"
 */
export interface StationStop {
    /** Stop ID (e.g., 30070 for Southport inbound) */
    stopId: string;
    /** Human-friendly stop name (e.g. "Southport"). The GTFS "stop_name" for this platform. This might be identical to stationName or might include extra route info, depending on CTA GTFS data. */
    stopName: string;
  /**
   * The GTFS "stop_desc", describing the service direction or other platform details.
   * For CTA, this often looks like "Service toward Loop" or "Service toward Kimball".
   * If no data was provided, it may default to "N/A".
   */
    stopDesc: string;
    /** Direction or platform description (e.g. "Service toward Loop"). For convenience, we store a direct "directionName" which is typically the same as stop_desc in CTA data. This might be used in the UI to quickly label the platform or direction. */
    directionName: string;
    /** Parent station ID reference */
    parentStationId: string;
    /** Optional lat/lon for the specific platform */
    lat?: number;
    lon?: number;
    /** Wheelchair boarding accessibility: "0" = unknown, "1" = accessible, "2" = not accessible */
    wheelchairBoarding?: string;
}

///////////////////////////////
//   Frontend-Specific Types 
///////////////////////////////

/**
 * Simplified station interface for frontend display
 */
export interface SimpleStation {
    stationId: string;
    stationName: string;
    stops: SimpleStop[];
}

/**
 * Simplified stop interface for frontend display
 */
export interface SimpleStop {
    stopId: string;
    stopName: string;
    directionName?: string;
    arrivals: SimpleArrival[];
}

/**
 * Simplified arrival interface for frontend display
 */
export interface SimpleArrival {
    rt: RouteColor;
    destNm: string;
    arrT: string;
    isDly: string;
}

///////////////////////////////
//      Arrival Types      
///////////////////////////////

/**
 * Core arrival information returned by CTA API
 * Represents a single Arrival record from the CTA Arrivals API.
 * Example usage: next arriving train at a given station or platform.
 */
export interface Arrival {
    staId: string;   // Parent station ID (4xxxx)
    stpId: string;   // Stop (platform) ID (3xxxx)
    staNm: string;   // Station name
    stpDe: string;   // Platform description (e.g. "Service toward Loop")
    rn: string;      // Train run number
    rt: string;      // Route Code (Red, Blue, Brn, etc.)
    destNm: string;  // Destination name
    arrT: string;    // CTA-provided predicted arrival time in the format "YYYYMMDD HH:mm:ss" (local Chicago time)
    prdt: string;    // Timestamp when prediction was generated
    isApp: string;   // "1" if approaching
    isDly: string;   // "1" if delayed
    isSch: string;   // "1" if schedule-based (no live data)
}

/**
 * Extended arrival information with additional fields
 */
export interface ArrivalEta extends Arrival {
    destSt: string;  // Destination station ID
    trDr: string;    // Direction code (1,5) used internally
    isFlt: string;   // "1" if a schedule fault was detected
    flags: string | null; // Not used currently
    lat: string;     // Train latitude
    lon: string;     // Train longitude
    heading: string; // Bearing in degrees (0-359)
}

///////////////////////////////
//       API Responses       
///////////////////////////////

/**
 * Response structure for the Arrivals API
 */
export interface ArrivalsApiResponse {
    ctatt: {
        tmst: string;               // Time when response was generated
        errCd: string;              // Error code
        errNm: string | null;       // Error message if any
        eta: ArrivalEta[];         // Array of arrivals
    };
}

/**
 * Response structure for the Follow Train API
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
 * Train location information
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

/**
 * Response structure for the Locations API
 */
export interface LocationsApiResponse {
    ctatt: {
        tmst: string;       // Time of response
        errCd: string;
        errNm: string | null;
        route: Array<{
            "@name": string;    // e.g. "red"
            train: TrainLocation[];
        }>;
    };
}

///////////////////////////////
//    API Response Types     
///////////////////////////////

/**
 * Structured response for station arrivals
 * For aggregated arrivals at a station, we often have data grouped by station, then stops.
 * This interface is used in the station arrivals route (api/cta/arrivals/station).
 */
export interface StationArrivalsResponse {
    stationId: string;
    stationName: string;
    stops: Array<{
        stopId: string;
        stopName: string;
        route: string;
        arrivals: Arrival[];
    }>;
}

/**
 * Structured response for stop arrivals
 * For arrivals specifically at a single stop (api/cta/arrivals/stop).
 */
export interface StopArrivalsResponse {
    stopId: string;
    stopName: string;
    stopDesc?: string;
    directionName?: string;
    route: string;
    arrivals: Arrival[];
} 