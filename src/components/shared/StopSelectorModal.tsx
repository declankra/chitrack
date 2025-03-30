import React, { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Search, Train, Loader2, Info } from "lucide-react";
import { Station, StationStop, Arrival } from "@/lib/types/cta";
import RouteIndicator from "@/components/shared/RouteIndicator";
import { cn } from "@/lib/utils";

// Define the structure for the processed stops derived from arrivals
interface ProcessedStop {
  stopId: string;
  directionName: string; // This will hold the stpDe value
  route?: string; // Add optional route field
}

// Update the type for the stop selection callback
interface StopSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStop: (selection: { stopId: string; stationId: string; directionName: string }) => void; // Updated signature
  stations: Station[];
  stationsLoading: boolean;
  title: string;
}

export default function StopSelectorModal({
  isOpen,
  onClose,
  onSelectStop,
  stations,
  stationsLoading,
  title,
}: StopSelectorModalProps) {
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // State for fetching and storing arrival-based stop directions
  const [processedStops, setProcessedStops] = useState<ProcessedStop[]>([]);
  const [isLoadingDirections, setIsLoadingDirections] = useState(false);
  const [directionsError, setDirectionsError] = useState<string | null>(null);

  // Filtered stations based on search query
  const filteredStations = useMemo(() => {
    if (!searchQuery || !stations.length) return stations;
    
    const query = searchQuery.toLowerCase().trim();
    return stations.filter((station: Station) => 
      station.stationName.toLowerCase().includes(query)
    );
  }, [searchQuery, stations]);

  // --- New Function: Fetch and process arrivals for directions ---
  const fetchAndProcessDirections = async (stationId: string) => {
    setIsLoadingDirections(true);
    setDirectionsError(null);
    setProcessedStops([]); // Clear previous stops

    try {
      console.log(`[Modal Fetch] Fetching arrivals for station: ${stationId}`);
      // Fetch real-time arrivals for the selected station
      const response = await fetch(`/api/cta/arrivals/station?stations=${stationId}`);
      console.log(`[Modal Fetch] Response status: ${response.status}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch directions (${response.status})`);
      }
      const arrivalsData = await response.json();
      console.log("[Modal Fetch] Received arrivalsData:", arrivalsData); // Log raw data

      // Process arrivals to get unique stops with descriptions (stpDe)
      const stopsMap = new Map<string, ProcessedStop>();
      
      // --- Updated Processing Logic --- 
      // Check if the response is an array with at least one station object
      if (Array.isArray(arrivalsData) && arrivalsData.length > 0 && arrivalsData[0].stops && Array.isArray(arrivalsData[0].stops)) {
        const stationData = arrivalsData[0];
        console.log(`[Modal Fetch] Processing ${stationData.stops.length} stops from station ${stationData.stationName} (ID: ${stationData.stationId}).`);
        
        stationData.stops.forEach((stop: any) => { // Using any temporarily as the structure isn't in types/cta yet
          // Use stopName as the direction name, as it seems descriptive in this response structure.
          // Provide a fallback if stopName is missing.
          const directionName = stop.stopName || `Stop ${stop.stopId}`;
          const route = stop.route; // Extract route
          
          // Ensure we don't add duplicates (though unlikely with this structure)
          if (!stopsMap.has(stop.stopId)) {
            stopsMap.set(stop.stopId, {
              stopId: stop.stopId,
              directionName: directionName,
              route: route, // Store the route
            });
          }
        });
      } else {
        console.log("[Modal Fetch] Response structure is not the expected array format: [{ stops: [...] }]");
      }
      // --- End Updated Processing Logic ---
      
      if (stopsMap.size === 0) {
         console.log("[Modal Fetch] No unique stops derived from the API response. Using GTFS fallback."); // Log fallback trigger
         // If no arrivals, fall back to GTFS stops for basic selection
         console.warn(`No live arrivals found for station ${stationId}. Falling back to GTFS stops.`);
         const fallbackStops = selectedStation?.stops.map(stop => ({
             stopId: stop.stopId,
             directionName: stop.directionName || `Stop ${stop.stopId}` // Use GTFS directionName or fallback
         })) || [];
         setProcessedStops(fallbackStops);
         if (fallbackStops.length === 0) {
            setDirectionsError("No stop information found for this station.");
         }
      } else {
          setProcessedStops(Array.from(stopsMap.values()));
      }

    } catch (error) {
      console.error("[Modal Fetch] Error fetching/processing directions:", error); // Log error
      setDirectionsError(error instanceof Error ? error.message : "An unknown error occurred");
      console.log("[Modal Fetch] Using GTFS fallback due to error."); // Log fallback trigger
      // Attempt fallback to GTFS stops on error
      const fallbackStops = selectedStation?.stops.map(stop => ({
          stopId: stop.stopId,
          directionName: stop.directionName || `Stop ${stop.stopId}`
      })) || [];
      setProcessedStops(fallbackStops);
       if (fallbackStops.length === 0) {
          setDirectionsError("Failed to fetch directions and no fallback available.");
       } else {
           setDirectionsError("Failed to fetch live directions. Showing available stops."); // Inform user about fallback
       }
    } finally {
      setIsLoadingDirections(false);
    }
  };
  // --- End New Function ---

  // Handle station selection - Updated
  const selectStation = (station: Station) => {
    setSelectedStation(station);
    // Fetch directions based on arrivals when a station is selected
    fetchAndProcessDirections(station.stationId); 
  };

  // Handle stop selection - Updated
  const handleSelectStop = (stop: ProcessedStop) => {
    if (!selectedStation) return; // Should not happen if a stop is selected
    
    // Call the callback with the required details
    onSelectStop({
      stopId: stop.stopId,
      stationId: selectedStation.stationId,
      directionName: stop.directionName, // Pass the selected stpDe
    });
    resetState();
  };

  // Reset component state - Updated
  const resetState = () => {
    setSelectedStation(null);
    setSearchQuery("");
    setProcessedStops([]); // Clear processed stops
    setIsLoadingDirections(false);
    setDirectionsError(null);
  };

  // Close modal and reset state
  const handleClose = () => {
    resetState();
    onClose();
  };
  
  // Add effect to reset when modal is closed externally
  useEffect(() => {
    if (!isOpen) {
      resetState();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border rounded-lg shadow-lg w-full max-w-lg max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Train className="h-4 w-4" />
            {title}
          </h2>
          <Button 
            type="button" 
            variant="ghost" 
            size="icon" 
            onClick={handleClose}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Search Input */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input 
              type="text"
              placeholder="Search stations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded bg-background"
              aria-label="Search stations"
            />
          </div>
        </div>
        
        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden flex">
          {/* Stations List (L1) */}
          <div className={cn(
              "w-1/2 overflow-y-auto border-r", 
              !selectedStation && "w-full" // Take full width if no station selected
             )}
          >
            {stationsLoading ? (
              <div className="p-4 text-center text-muted-foreground">Loading stations...</div>
            ) : filteredStations.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">No stations found</div>
            ) : (
              <div className="divide-y">
                {filteredStations.map((station: Station) => (
                  <button
                    key={station.stationId}
                    type="button"
                    className={cn(
                      "w-full text-left p-3 hover:bg-accent/50 transition-colors",
                      selectedStation?.stationId === station.stationId && 'bg-accent font-semibold' // Highlight selected
                    )}
                    onClick={() => selectStation(station)}
                  >
                    {station.stationName}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Directions List (L2 - Derived from Arrivals) */}
          {selectedStation && (
            <div className="w-1/2 overflow-y-auto">
              <div className="p-2 bg-muted/50 sticky top-0 border-b">
                <p className="text-sm font-medium truncate" title={selectedStation.stationName}>{selectedStation.stationName}</p>
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-muted-foreground">Select direction</p>
                  {!isLoadingDirections && !directionsError && processedStops.length > 0 && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground/80" title="Showing currently active directions based on live data. Check back later if your stop isn't listed.">
                      <Info className="h-3 w-3" />
                      <span>Active Only</span>
                    </div>
                  )}
                </div>
              </div>
              {/* Loading state for directions */}
              {isLoadingDirections && (
                 <div className="p-4 flex items-center justify-center text-muted-foreground">
                   <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                   Loading directions...
                 </div>
              )}
              {/* Error state for directions */}
              {directionsError && !isLoadingDirections && (
                 <div className="p-4 text-center text-destructive">
                    {directionsError}
                 </div>
              )}
              {/* Directions list */}
              {!isLoadingDirections && !directionsError && processedStops.length === 0 && (
                  <div className="p-4 text-center text-muted-foreground">
                    No directions available.
                  </div>
              )}
              {!isLoadingDirections && processedStops.length > 0 && (
                <div className="divide-y">
                  {processedStops.map((stop) => (
                    <button
                      key={stop.stopId}
                      type="button"
                      className="w-full text-left p-3 hover:bg-accent/50 transition-colors flex items-center gap-2"
                      onClick={() => handleSelectStop(stop)}
                    >
                      {/* Render Route Indicator */}
                      {/* Provide empty string fallback for route prop */}
                      <RouteIndicator route={stop.route || ''} size="sm" />
                      {/* Display the directionName (stopName from API) */}
                      <p className="text-sm flex-grow">{stop.directionName}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 