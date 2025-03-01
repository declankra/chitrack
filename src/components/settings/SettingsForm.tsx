// src/components/settings/SettingsForm.tsx

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { MapPin, X } from "lucide-react";
import StopSelectorModal from "@/components/shared/StopSelectorModal";
import { Station, StationStop } from "@/lib/types/cta";
import type { UserData } from "@/lib/types/user";
import { findStopById } from "@/lib/utilities/findStop";

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
  // Local state for form data
  const [userName, setUserName] = useState(userData.userName || "");
  const [homeStop, setHomeStop] = useState(userData.homeStop || "");
  const [favoriteStops, setFavoriteStops] = useState<string[]>(
    Array.isArray(userData.favoriteStops) && userData.favoriteStops.length > 0
      ? userData.favoriteStops
      : [""]
  );
  const [paidUserStatus, setPaidUserStatus] = useState(userData.paidUserStatus || false);
  
  // Station selection UI state
  const [showStationSelector, setShowStationSelector] = useState(false);
  const [selectedStopType, setSelectedStopType] = useState<"home" | "favorite0" | "favorite1" | "favorite2" | null>(null);
  const [favoriteIndex, setFavoriteIndex] = useState<number | null>(null);

  // Update local state when userData changes (e.g. after refresh)
  React.useEffect(() => {
    setUserName(userData.userName || "");
    setHomeStop(userData.homeStop || "");
    setFavoriteStops(
      Array.isArray(userData.favoriteStops) && userData.favoriteStops.length > 0
        ? userData.favoriteStops
        : [""]
    );
    setPaidUserStatus(userData.paidUserStatus || false);
  }, [userData]);

  // Get home stop and favorite stop details
  const homeStopDetails = React.useMemo(() => {
    return findStopById(homeStop, stations);
  }, [homeStop, stations]);
  
  const favoriteStopDetails = React.useMemo(() => {
    if (!favoriteStops?.length || !stations.length) return [];
    
    return favoriteStops.map(stopId => {
      if (!stopId) return null;
      return findStopById(stopId, stations);
    });
  }, [favoriteStops, stations]);

  // Handle station selector opening
  const openStationSelector = (type: "home" | "favorite0" | "favorite1" | "favorite2") => {
    setSelectedStopType(type);
    setShowStationSelector(true);
    
    if (type.startsWith("favorite")) {
      const index = parseInt(type.replace("favorite", ""));
      setFavoriteIndex(index);
    } else {
      setFavoriteIndex(null);
    }
  };
  
  // Handle stop selection and close station selector
  const handleStopSelection = (stop: StationStop) => {
    if (!selectedStopType) return;
    
    if (selectedStopType === "home") {
      setHomeStop(stop.stopId);
    } else if (favoriteIndex !== null) {
      const updatedFavorites = [...favoriteStops];
      updatedFavorites[favoriteIndex] = stop.stopId;
      setFavoriteStops(updatedFavorites);
    }
    
    closeStationSelector();
  };
  
  // Close station selector
  const closeStationSelector = () => {
    setShowStationSelector(false);
    setSelectedStopType(null);
    setFavoriteIndex(null);
  };

  // Add or remove favorite stops, up to a max of 3
  const addFavoriteStopField = () => {
    if (favoriteStops.length < 3) {
      setFavoriteStops([...favoriteStops, ""]);
    }
  };

  const removeFavoriteStopField = (index: number) => {
    const updatedFavorites = [...favoriteStops];
    updatedFavorites.splice(index, 1);
    setFavoriteStops(updatedFavorites);
  };

  // Get modal title based on selected stop type
  const getModalTitle = () => {
    if (selectedStopType === "home") {
      return "Select Home Stop";
    } else {
      return "Select Favorite Stop";
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const updatedUserData: UserData = {
      userName,
      homeStop,
      favoriteStops: favoriteStops.filter(stop => stop !== ""),
      paidUserStatus,
    };
    
    await onSave(updatedUserData);
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
              <label className="block text-sm font-medium mb-1">
                User Name
              </label>
              <input
                className="border border-border rounded px-3 py-2 w-full"
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
              <div className="border border-border rounded overflow-hidden">
                {homeStopDetails ? (
                  <div className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{homeStopDetails.station.stationName}</p>
                        <p className="text-xs text-muted-foreground">{homeStopDetails.stop.directionName}</p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => openStationSelector("home")}
                    >
                      Change
                    </Button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="w-full p-3 text-left text-muted-foreground hover:bg-accent/50 transition-colors"
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
                  const stopDetails = favoriteStopDetails[idx];
                  return (
                    <div key={idx} className="border border-border rounded overflow-hidden">
                      {stopDetails ? (
                        <div className="p-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{stopDetails.station.stationName}</p>
                              <p className="text-xs text-muted-foreground">{stopDetails.stop.directionName}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => openStationSelector(`favorite${idx}` as any)}
                            >
                              Change
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeFavoriteStopField(idx)}
                              className="text-destructive hover:text-destructive/80"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="w-full p-3 text-left text-muted-foreground hover:bg-accent/50 transition-colors flex items-center justify-between"
                          onClick={() => openStationSelector(`favorite${idx}` as any)}
                        >
                          <span>Select favorite stop {idx + 1}</span>
                          {idx > 0 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeFavoriteStopField(idx);
                              }}
                              className="text-destructive hover:text-destructive/80"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
              
              {favoriteStops.length < 3 && (
                <button
                  type="button"
                  className="mt-2 text-xs text-primary hover:underline flex items-center gap-1"
                  onClick={addFavoriteStopField}
                >
                  + Add Another Favorite Stop
                </button>
              )}
            </div>
            
            {/* Paywall Status (Web Not Enforced) */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">
                Paid User
              </label>
              <input
                type="checkbox"
                checked={paidUserStatus}
                onChange={(e) => setPaidUserStatus(e.target.checked)}
                className="rounded border-border"
              />
              <p className="text-xs text-muted-foreground ml-2">
                (Only enforced in iOS app)
              </p>
            </div>
            
            {/* Actions */}
            <div className="flex items-center justify-between mt-4">
              <Button
                type="submit"
                disabled={isSaving || isFetching}
                className="bg-primary text-primary-foreground px-4 py-2 rounded"
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
                {isFetching ? "Loading..." : "Refresh"}
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