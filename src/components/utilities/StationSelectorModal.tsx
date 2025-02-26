import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { X, Search, Train } from "lucide-react";
import { Station, StationStop } from "@/lib/types/cta";

interface StationSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStop: (stop: StationStop) => void;
  stations: Station[];
  stationsLoading: boolean;
  title: string;
}

export default function StationSelectorModal({
  isOpen,
  onClose,
  onSelectStop,
  stations,
  stationsLoading,
  title,
}: StationSelectorModalProps) {
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Filtered stations based on search query
  const filteredStations = useMemo(() => {
    if (!searchQuery || !stations.length) return stations;
    
    const query = searchQuery.toLowerCase().trim();
    return stations.filter((station: Station) => 
      station.stationName.toLowerCase().includes(query)
    );
  }, [searchQuery, stations]);

  // Handle station selection
  const selectStation = (station: Station) => {
    setSelectedStation(station);
  };

  // Handle stop selection
  const handleSelectStop = (stop: StationStop) => {
    onSelectStop(stop);
    resetState();
  };

  // Reset component state
  const resetState = () => {
    setSelectedStation(null);
    setSearchQuery("");
  };

  // Close modal and reset state
  const handleClose = () => {
    resetState();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border rounded-lg shadow-lg w-full max-w-lg max-h-[80vh] flex flex-col">
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
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-hidden flex">
          {/* Stations List */}
          <div className={`w-1/2 overflow-y-auto border-r ${selectedStation ? '' : 'w-full'}`}>
            {stationsLoading ? (
              <div className="flex items-center justify-center h-20">
                <p className="text-sm text-muted-foreground">Loading stations...</p>
              </div>
            ) : filteredStations.length === 0 ? (
              <div className="p-4 text-center">
                <p className="text-sm text-muted-foreground">No stations found</p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredStations.map((station: Station) => (
                  <button
                    key={station.stationId}
                    type="button"
                    className={`w-full text-left p-3 hover:bg-accent/50 transition-colors ${
                      selectedStation?.stationId === station.stationId ? 'bg-accent/80' : ''
                    }`}
                    onClick={() => selectStation(station)}
                  >
                    <p className="font-medium">{station.stationName}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Stops List */}
          {selectedStation && (
            <div className="w-1/2 overflow-y-auto">
              <div className="p-2 bg-muted/50 sticky top-0">
                <p className="text-sm font-medium">{selectedStation.stationName}</p>
                <p className="text-xs text-muted-foreground">Select direction</p>
              </div>
              <div className="divide-y">
                {selectedStation.stops.map((stop) => (
                  <button
                    key={stop.stopId}
                    type="button"
                    className="w-full text-left p-3 hover:bg-accent/50 transition-colors"
                    onClick={() => handleSelectStop(stop)}
                  >
                    <p className="text-sm">{stop.directionName}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 