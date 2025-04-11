// src/components/settings/SettingsForm.tsx

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { MapPin, X } from "lucide-react";
import StopSelectorModal from "@/components/shared/StopSelectorModal";
import { Station, StationStop } from "@/lib/types/cta";
import type { UserData, StopInfo } from "@/lib/types/user";
import { findStopById } from "@/lib/utilities/findStop";

// Define the structure received from the updated modal
interface StopSelection {
  stopId: string;
  stationId: string;
  directionName: string; // This is the stpDe value
}

interface SettingsFormProps {
  userData: UserData | null;
  stations: Station[];
  stationsLoading: boolean;
  isSaving: boolean;
  isFetching: boolean;
  onSave: (updatedFields: Partial<Omit<UserData, 'deviceId' | 'userId' | 'createdAt' | 'updatedAt' | 'firstOpenDate'>>) => Promise<void | boolean>;
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
  // Calculate initial state outside useState for clarity
  const initialUserName = userData?.userName || "";
  const initialHomeStopId = userData?.homeStop?.stop_id || null;
  const initialFavoriteStopIds = userData?.favoriteStops?.map(stop => stop.stop_id) ?? [];
  const initialPaidUserStatus = userData?.paidUserStatus || false;

  const [userName, setUserName] = useState(initialUserName);
  const [homeStopId, setHomeStopId] = useState<string | null>(initialHomeStopId);
  // Initialize state with the pre-calculated value
  const [favoriteStopIds, setFavoriteStopIds] = useState<string[]>(initialFavoriteStopIds);
  const [paidUserStatus, setPaidUserStatus] = useState(initialPaidUserStatus);
  
  const [showStationSelector, setShowStationSelector] = useState(false);
  const [selectedStopType, setSelectedStopType] = useState<"home" | `favorite${number}` | null>(null);
  const [favoriteIndex, setFavoriteIndex] = useState<number | null>(null);

  // useEffect updates state when userData prop changes
  React.useEffect(() => {
    if (userData) {
      setUserName(userData.userName || "");
      setHomeStopId(userData.homeStop?.stop_id || null);
      setFavoriteStopIds(userData.favoriteStops?.map(stop => stop.stop_id) ?? []);
      setPaidUserStatus(userData.paidUserStatus || false);
    } else {
      setUserName("");
      setHomeStopId(null);
      setFavoriteStopIds([]);
      setPaidUserStatus(false);
    }
  }, [userData]);
  
  // --- Derive display details directly from IDs using findStopById --- 
  const homeStopDisplayDetails = React.useMemo(() => {
    if (!homeStopId) return null;
    const details = findStopById(homeStopId, stations);
    // Return display structure needed by UI
    return details ? { stationName: details.station.stationName, directionName: details.stop.directionName } : null;
  }, [homeStopId, stations]);
  
  const favoriteStopsDisplayDetails = React.useMemo(() => {
     if (!stations.length) return new Array(favoriteStopIds.length).fill(null);
     return favoriteStopIds.map((stopId) => {
        if (!stopId) return null;
        const details = findStopById(stopId, stations);
        return details ? { stationName: details.station.stationName, directionName: details.stop.directionName } : null;
     });
  }, [favoriteStopIds, stations]);
  // --- End Derive Display Details --- 

  const openStationSelector = (type: "home" | `favorite${number}`) => {
    setSelectedStopType(type);
    setShowStationSelector(true);
    if (type.startsWith("favorite")) {
      setFavoriteIndex(parseInt(type.replace("favorite", "")));
    } else {
      setFavoriteIndex(null);
    }
  };
  
  const handleStopSelection = (selection: StopSelection) => {
    if (!selectedStopType) return;
    const { stopId } = selection; // Primarily need the stopId to store

    if (selectedStopType === "home") {
      setHomeStopId(stopId); // Store the ID
      // No need for temp state anymore
    } else if (favoriteIndex !== null && favoriteIndex >= 0) {
      const updatedFavorites = [...favoriteStopIds];
      if (favoriteIndex >= updatedFavorites.length) {
         updatedFavorites.push(stopId);
      } else {
         updatedFavorites[favoriteIndex] = stopId;
      }
      setFavoriteStopIds(updatedFavorites); // Store the IDs
      // No need for temp state anymore
    }
    closeStationSelector();
  };
  
  const closeStationSelector = () => {
    setShowStationSelector(false);
    setSelectedStopType(null);
    setFavoriteIndex(null);
  };

  const addFavoriteStopField = () => {
    if (favoriteStopIds.length < 3) {
      setFavoriteStopIds([...favoriteStopIds, ""]); // Add empty string placeholder for the input field logic
    }
  };

  const removeFavoriteStopField = (index: number) => {
    const updatedFavorites = [...favoriteStopIds];
    updatedFavorites.splice(index, 1);
    setFavoriteStopIds(updatedFavorites);
  };

  const getModalTitle = () => {
    return selectedStopType === "home" ? "Select Home Stop & Direction" : "Select Favorite Stop & Direction";
  };

  // Helper to convert a stop ID to a StopInfo object (partially populated)
  const createStopInfoFromId = (stopId: string | null): StopInfo | null => {
    if (!stopId) return null;
    const details = findStopById(stopId, stations);
    if (!details) return null; // Stop details not found

    // Correctly access directionName from details.stop
    return {
        stop_id: details.stop.stopId, // Use stopId from the details
        route_id: 'Unknown', // Placeholder - Needs to be sourced if possible
        direction_id: details.stop.directionName || 'Unknown', // Use directionName
        stop_name: details.stop.stopName || details.station.stationName || 'Unknown Stop' // Use stopName or fallback
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData) return; // Should not happen if form is rendered

    // Convert IDs back to StopInfo objects for saving
    const homeStopForSave = createStopInfoFromId(homeStopId);
    const favoriteStopsForSave = favoriteStopIds
      .map(id => createStopInfoFromId(id))
      .filter((stop): stop is StopInfo => stop !== null); // Filter out nulls

    // Prepare the partial update object expected by the hook
    const updatedFields: Partial<Omit<UserData, 'deviceId' | 'userId' | 'createdAt' | 'updatedAt' | 'firstOpenDate'>> = {
      userName: userName,
      homeStop: homeStopForSave,
      favoriteStops: favoriteStopsForSave,
      paidUserStatus: paidUserStatus,
    };

    await onSave(updatedFields); // Call onSave with the correctly typed partial update
  };

  // Render loading state if user data or stations aren't ready
  if (!userData || stationsLoading) {
      return (
          <Card>
              <CardHeader><CardTitle>Customize Your Profile</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                  <div className="h-8 bg-muted rounded w-3/4 animate-pulse"></div> {/* Placeholder for name */}
                  <div className="h-16 bg-muted rounded w-full animate-pulse"></div> {/* Placeholder for home stop */}
                  <div className="h-16 bg-muted rounded w-full animate-pulse"></div> {/* Placeholder for fav stop */}
                  <div className="h-6 bg-muted rounded w-1/2 animate-pulse"></div> {/* Placeholder for paid status */}
                  <div className="h-10 bg-muted rounded w-1/4 animate-pulse self-end"></div> {/* Placeholder for button */}
              </CardContent>
          </Card>
      );
  }

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
                {favoriteStopIds.map((stopId, idx) => {
                  const stopDisplayDetails = favoriteStopsDisplayDetails[idx];
                  return (
                    <div key={`fav-${idx}`} className="border border-border rounded overflow-hidden min-h-[60px]">
                      {stopId ? (
                        <div className="p-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <div className="flex-grow">
                              <p className="font-medium">{stopDisplayDetails?.stationName || "Station Name Missing"}</p>
                              <p className="text-xs text-muted-foreground">{stopDisplayDetails?.directionName || "Direction Missing"}</p>
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
                           {/* Allow removing empty slots */}
                           <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                 e.stopPropagation();
                                 removeFavoriteStopField(idx);
                              }}
                              className="text-destructive hover:text-destructive/80"
                              aria-label={`Remove Favorite Stop ${idx + 1}`}
                           >
                              <X className="h-4 w-4" />
                           </Button>
                        </button>
                      )}
                    </div>
                  );
                })}
                
                {/* Add Favorite Button */} 
                {favoriteStopIds.length < 3 && (
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
            
            {/* Paywall Status */}
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
                disabled={isSaving || isFetching || !userData} // Disable if no userData
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