// src/lib/data/stations.ts
type StationID = number; // 40xxx range - parent stations
type StopID = number;    // 30xxx range - individual platforms

export interface StationStop {
    stpId: string;
    stpDe: string; // Stop description (direction)
  }
  
  export interface Station {
    staId: string;
    staNm: string; // Station name
    stops: StationStop[];
    routes: string[]; // Array of route codes that serve this station
    lat?: number;    // Latitude for mapping
    lon?: number;    // Longitude for mapping
  }
  
  // Route information with colors and descriptions
  export const ROUTES = {
    Red: {
      name: "Red Line",
      description: "Howard-95th/Dan Ryan",
      color: "#c60c30"
    },
    Blue: {
      name: "Blue Line",
      description: "O'Hare-Forest Park",
      color: "#00a1de"
    },
    // ... add other routes
  } as const;
  
  // This data is derived from the CTA API documentation
  export const stations: Station[] = [
    {
      staId: "40380",
      staNm: "Clark/Lake",
      stops: [
        { stpId: "30074", stpDe: "Inner Loop" },
        { stpId: "30075", stpDe: "Outer Loop" },
        { stpId: "30374", stpDe: "Forest Park-bound" },
        { stpId: "30375", stpDe: "O'Hare-bound" }
      ],
      routes: ["Blue", "Brown", "Green", "Orange", "Purple", "Pink"]
    },
    // ... Add more stations from the API documentation
  ];
  
  // We'll use this to store our cached station data
  let CACHED_STATIONS: Station[] = [];
  
  // Function to update the cached stations
  export function updateCachedStations(stations: Station[]) {
    CACHED_STATIONS = stations;
  }
  
  // Helper function to search stations
  export function searchStations(query: string): Station[] {
    const normalizedQuery = query.toLowerCase().trim();
    
    return CACHED_STATIONS.filter(station => 
      station.staNm.toLowerCase().includes(normalizedQuery)
    );
  }
  
  // Get a station by ID
  export function getStation(staId: string): Station | undefined {
    return CACHED_STATIONS.find(station => station.staId === staId);
  }
  
  // Get all routes
  export const routes = {
    Red: "Red Line (Howard-95th/Dan Ryan)",
    Blue: "Blue Line (O'Hare-Forest Park)",
    Brn: "Brown Line (Kimball-Loop)",
    G: "Green Line (Harlem/Lake-Ashland/63rd-Cottage Grove)",
    Org: "Orange Line (Midway-Loop)",
    P: "Purple Line (Linden-Howard)",
    Pink: "Pink Line (54th/Cermak-Loop)",
    Y: "Yellow Line (Skokie-Howard)"
  };