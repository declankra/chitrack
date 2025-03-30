// src/components/settings/SettingsForm.tsx

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { MapPin, X } from "lucide-react";
import StopSelectorModal from "@/components/shared/StopSelectorModal";
import { Station, StationStop } from "@/lib/types/cta";
import type { UserData } from "@/lib/types/user";
import { findStopById } from "@/lib/utilities/findStop";

// Define the structure received from the updated modal
interface StopSelection {
  stopId: string;
  stationId: string;
  directionName: string; // This is the stpDe value
}

interface SettingsFormProps {
  userData: UserData;
  stations: Station[];
  stationsLoading: boolean;
  isSaving: boolean;
  isFetching: boolean;
  onSave: (userData: UserData) => Promise<void>;
  onRefresh: () => Promise<void>;
}

export default function SettingsForm({
  userData,
  stations,
  stationsLoading,
  isSaving,
  isFetching,
  onSave,
  onRefresh,
}: SettingsFormProps) {
  // Local state for form data (persisted)
  const [userName, setUserName] = useState(userData.userName || "");
  const [homeStop, setHomeStop] = useState(userData.homeStop || "");
  const [favoriteStops, setFavoriteStops] = useState<string[]>(
    Array.isArray(userData.favoriteStops) && userData.favoriteStops.length > 0
      ? userData.favoriteStops
      : [] // Initialize as empty, add button handles adding first field
  );
  const [paidUserStatus, setPaidUserStatus] = useState(userData.paidUserStatus || false);
  
  // --- Temporary state for displaying selected direction names --- 
  const [tempHomeStopInfo, setTempHomeStopInfo] = useState<{ stationName: string | null, directionName: string | null } | null>(null);
  const [tempFavoriteStopInfo, setTempFavoriteStopInfo] = useState<Array<{ stationName: string | null, directionName: string | null } | null>>([]);
  // --- End temporary state ---
  
  // Station selection UI state
  const [showStationSelector, setShowStationSelector] = useState(false);
  const [selectedStopType, setSelectedStopType] = useState<"home" | `favorite${number}` | null>(null);
  const [favoriteIndex, setFavoriteIndex] = useState<number | null>(null);

  // Update local state when userData changes (e.g. after refresh or initial load)
  React.useEffect(() => {
    setUserName(userData.userName || "");
    setHomeStop(userData.homeStop || "");
    const initialFavorites = Array.isArray(userData.favoriteStops) && userData.favoriteStops.length > 0
      ? userData.favoriteStops
      : [];
    setFavoriteStops(initialFavorites);
    setPaidUserStatus(userData.paidUserStatus || false);
    
    // Reset temporary display state on data refresh
    setTempHomeStopInfo(null);
    setTempFavoriteStopInfo(new Array(initialFavorites.length).fill(null)); 
    
  }, [userData]);
  
  // Find station name helper (needed for temporary display)
  const findStationName = (stationId: string): string | null => {
      const station = stations.find(s => s.stationId === stationId);
      return station?.stationName || null;
  }

  // Get home stop details for display (uses temp state first, then fallback)
  const homeStopDisplayDetails = React.useMemo(() => {
    if (tempHomeStopInfo?.stationName && tempHomeStopInfo?.directionName) {
      return tempHomeStopInfo;
    }
    // Fallback to findStopById using the stored stopId
    const details = findStopById(homeStop, stations);
    return details ? { stationName: details.station.stationName, directionName: details.stop.directionName } : null;
  }, [homeStop, stations, tempHomeStopInfo]);
  
  // Get favorite stop details for display (uses temp state first, then fallback)
  const favoriteStopsDisplayDetails = React.useMemo(() => {
     if (!stations.length) return new Array(favoriteStops.length).fill(null); // Handle stations not loaded
     
     return favoriteStops.map((stopId, idx) => {
        // Prioritize temporary state for this index
        if (tempFavoriteStopInfo[idx]?.stationName && tempFavoriteStopInfo[idx]?.directionName) {
           return tempFavoriteStopInfo[idx];
        }
        // Fallback to findStopById using the stored stopId
        if (!stopId) return null;
        const details = findStopById(stopId, stations);
        return details ? { stationName: details.station.stationName, directionName: details.stop.directionName } : null;
     });
  }, [favoriteStops, stations, tempFavoriteStopInfo]);

  // Handle station selector opening
  const openStationSelector = (type: "home" | `favorite${number}`) => {
    setSelectedStopType(type);
    setShowStationSelector(true);
    
    if (type.startsWith("favorite")) {
      const index = parseInt(type.replace("favorite", ""));
      setFavoriteIndex(index);
    } else {
      setFavoriteIndex(null);
    }
  };
  
  // Handle stop selection and close station selector - Updated
  const handleStopSelection = (selection: StopSelection) => {
    if (!selectedStopType) return;
    
    const { stopId, stationId, directionName } = selection;
    const stationName = findStationName(stationId); // Get station name for display
    const displayInfo = { stationName, directionName };
    
    if (selectedStopType === "home") {
      setHomeStop(stopId);
      setTempHomeStopInfo(displayInfo); // Store for immediate display
    } else if (favoriteIndex !== null && favoriteIndex >= 0) {
      const updatedFavorites = [...favoriteStops];
      // Ensure the array is long enough (might happen if adding a new favorite)
      if (favoriteIndex >= updatedFavorites.length) {
         updatedFavorites.push(stopId);
      } else {
         updatedFavorites[favoriteIndex] = stopId;
      }
      setFavoriteStops(updatedFavorites);
      
      // Update temporary display state for favorites
      const updatedTempInfo = [...tempFavoriteStopInfo];
      updatedTempInfo[favoriteIndex] = displayInfo;
      setTempFavoriteStopInfo(updatedTempInfo);
    }
    
    closeStationSelector();
  };
  
  // Close station selector
  const closeStationSelector = () => {
    setShowStationSelector(false);
    setSelectedStopType(null);
    setFavoriteIndex(null);
  };

  // Add favorite stops field
  const addFavoriteStopField = () => {
    if (favoriteStops.length < 3) {
      setFavoriteStops([...favoriteStops, ""]); // Add empty string placeholder
      setTempFavoriteStopInfo([...tempFavoriteStopInfo, null]); // Add placeholder for temp info
    }
  };

  // Remove favorite stops field - Updated
  const removeFavoriteStopField = (index: number) => {
    const updatedFavorites = [...favoriteStops];
    updatedFavorites.splice(index, 1);
    setFavoriteStops(updatedFavorites);
    
    // Also remove corresponding temp info
    const updatedTempInfo = [...tempFavoriteStopInfo];
    updatedTempInfo.splice(index, 1);
    setTempFavoriteStopInfo(updatedTempInfo);
  };

  // Get modal title based on selected stop type
  const getModalTitle = () => {
    if (selectedStopType === "home") {
      return "Select Home Stop & Direction";
    } else {
      return "Select Favorite Stop & Direction";
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Save only the essential data (stopIds)
    const updatedUserData: UserData = {
      userName,
      homeStop, 
      favoriteStops: favoriteStops.filter(stop => !!stop), // Filter out empty strings
      paidUserStatus,
    };
    
    await onSave(updatedUserData);
    
    // Optionally clear temporary display state after successful save
    // setTempHomeStopInfo(null);
    // setTempFavoriteStopInfo(new Array(favoriteStops.filter(s => !!s).length).fill(null));
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Customize Your Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* User Name */}
            <div>
              <label htmlFor="userName" className="block text-sm font-medium mb-1">
                User Name
              </label>
              <input
                id="userName"
                className="border border-border rounded px-3 py-2 w-full bg-background text-foreground"
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Your Name"
              />
            </div>
            
            {/* Home Stop */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Home Stop
              </label>
              <div className="border border-border rounded overflow-hidden min-h-[60px]">
                {homeStopDisplayDetails ? (
                  <div className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="flex-grow">
                        <p className="font-medium">{homeStopDisplayDetails.stationName || "Station Name Missing"}</p>
                        <p className="text-xs text-muted-foreground">{homeStopDisplayDetails.directionName || "Direction Missing"}</p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => openStationSelector("home")}
                      aria-label="Change Home Stop"
                    >
                      Change
                    </Button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="w-full p-3 text-left text-muted-foreground hover:bg-accent/50 transition-colors flex items-center justify-center h-full"
                    onClick={() => openStationSelector("home")}
                  >
                    Select your home stop
                  </button>
                )}
              </div>
            </div>
            
            {/* Favorite Stops */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Favorite Stops (up to 3)
              </label>
              <div className="space-y-2">
                {favoriteStops.map((stopId, idx) => {
                  const stopDisplayDetails = favoriteStopsDisplayDetails[idx];
                  return (
                    <div key={`fav-${idx}`} className="border border-border rounded overflow-hidden min-h-[60px]">
                      {stopDisplayDetails ? (
                        <div className="p-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <div className="flex-grow">
                              <p className="font-medium">{stopDisplayDetails.stationName || "Station Name Missing"}</p>
                              <p className="text-xs text-muted-foreground">{stopDisplayDetails.directionName || "Direction Missing"}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => openStationSelector(`favorite${idx}`)}
                              aria-label={`Change Favorite Stop ${idx + 1}`}
                            >
                              Change
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeFavoriteStopField(idx)}
                              className="text-destructive hover:text-destructive/80"
                              aria-label={`Remove Favorite Stop ${idx + 1}`}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="w-full p-3 text-left text-muted-foreground hover:bg-accent/50 transition-colors flex items-center justify-between h-full"
                          onClick={() => openStationSelector(`favorite${idx}`)}
                        >
                          <span>Select favorite stop {idx + 1}</span>
                           {/* Allow removing empty slots if they aren't the first one */}
                           {favoriteStops.length > 0 && (
                              <Button
                                 type="button"
                                 variant="ghost"
                                 size="icon"
                                 onClick={(e) => {
                                    e.stopPropagation(); // Prevent opening the modal
                                    removeFavoriteStopField(idx);
                                 }}
                                 className="text-destructive hover:text-destructive/80"
                                 aria-label={`Remove Favorite Stop ${idx + 1}`}
                              >
                                 <X className="h-4 w-4" />
                              </Button>
                           )}
                        </button>
                      )}
                    </div>
                  );
                })}
                
                {/* Add Favorite Button */} 
                {favoriteStops.length < 3 && (
                   <button
                     type="button"
                     className="mt-2 text-sm hover:underline flex items-center gap-1 p-2 border border-dashed rounded w-full justify-center text-muted-foreground hover:text-primary hover:border-primary"
                     onClick={addFavoriteStopField}
                   >
                     + Add Another Favorite Stop
                   </button>
                )}
              </div>
            </div>
            
            {/* Paywall Status (Web Not Enforced) */}
            <div className="flex items-center gap-2 pt-2">
               <input
                  id="paidUser"
                  type="checkbox"
                  checked={paidUserStatus}
                  onChange={(e) => setPaidUserStatus(e.target.checked)}
                  className="rounded border-border"
               />
               <label htmlFor="paidUser" className="text-sm font-medium">
                  Paid User Status
               </label>
               <p className="text-xs text-muted-foreground ml-2">
                  (Affects iOS app features)
               </p>
            </div>
            
            {/* Actions */}
            <div className="flex items-center justify-between pt-4">
              <Button
                type="submit"
                disabled={isSaving || isFetching}
                className="px-4 py-2 rounded"
              >
                {isSaving ? "Saving..." : "Save Settings"}
              </Button>
              <Button
                type="button"
                onClick={onRefresh}
                disabled={isFetching || isSaving}
                variant="outline"
                className="ml-4"
              >
                {isFetching ? "Loading..." : "Refresh Data"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      
      {/* Station Selector Modal */}
      <StopSelectorModal
        isOpen={showStationSelector}
        onClose={closeStationSelector}
        onSelectStop={handleStopSelection}
        stations={stations}
        stationsLoading={stationsLoading}
        title={getModalTitle()}
      />
    </>
  );
}