// src/app/(app)/settings/page.tsx

"use client";

import React, { useEffect, useState, useMemo } from "react";
import { getSupabase } from "@/lib/supabase";
import { useStations } from "@/lib/hooks/useStations";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, AlertCircle, X, MapPin } from "lucide-react";
import FeedbackDialog from "@/components/utilities/FeedbackDialog";
import StationSelectorModal from "@/components/utilities/StationSelectorModal";
import { Station, StationStop } from "@/lib/types/cta";
import type { UserData } from "@/lib/types/user";


export default function SettingsPage() {
  // Simulate or determine userID in a real project:
  // This might come from authentication or a unique device ID.
  // For demonstration, we use a fixed "demo-user".
  const DEMO_USER_ID = "demo-user";

  // Fetch station data
  const { data: stations = [], isLoading: stationsLoading } = useStations();

  // Local state for user data
  const [userName, setUserName] = useState("");
  const [homeStop, setHomeStop] = useState("");
  const [favoriteStops, setFavoriteStops] = useState<string[]>([""]);
  const [paidUserStatus, setPaidUserStatus] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedSuccessfully, setSavedSuccessfully] = useState(false);
  
  // Station selection UI state
  const [showStationSelector, setShowStationSelector] = useState(false);
  const [selectedStopType, setSelectedStopType] = useState<"home" | "favorite0" | "favorite1" | "favorite2" | null>(null);
  const [favoriteIndex, setFavoriteIndex] = useState<number | null>(null);

  // Status message
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Fetch user info from Supabase
  const fetchUserData = async () => {
    try {
      setFetching(true);
      setError(null);
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("chitrack_users")
        .select("*")
        .eq("userID", DEMO_USER_ID)
        .single();

      if (error && !data) {
        // If no data is found, it may be that user doesn't exist yet
        return;
      }
      if (data) {
        const userData = data as unknown as UserData;
        setUserName(userData.userName || "");
        setHomeStop(userData.homeStop || "");
        setFavoriteStops(userData.favoriteStops?.length ? userData.favoriteStops : [""]);
        setPaidUserStatus(userData.paidUserStatus || false);
      }
    } catch (err) {
      console.error("Error fetching user data:", err);
      setError("Failed to load settings. Please try again.");
    } finally {
      setFetching(false);
    }
  };
  
  // On component mount, fetch user data
  useEffect(() => {
    fetchUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save user info to Supabase
  const saveUserData = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("chitrack_users")
        .upsert(
          {
            userID: DEMO_USER_ID,
            userName,
            homeStop,
            favoriteStops: favoriteStops.filter(stop => stop !== ""), // Remove empty stops
            paidUserStatus,
          },
          { onConflict: "userID" }
        )
        .select()
        .single();

      if (error) {
        console.error("Error saving user data:", error);
        setError("Failed to save settings. Please try again.");
      } else {
        // Reflect saved state
        if (data) {
          console.log("User updated:", data);
          setSavedSuccessfully(true);
        }
      }
    } catch (err) {
      console.error("Error saving user data:", err);
      setError("Failed to save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Show success message for 3 seconds when save is successful
  useEffect(() => {
    if (savedSuccessfully) {
      setStatusMessage({
        type: "success",
        message: "Settings saved successfully!",
      });
      
      const timer = setTimeout(() => {
        setSavedSuccessfully(false);
        setStatusMessage(null);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [savedSuccessfully]);

  // Get home stop and favorite stop details
  const homeStopDetails = useMemo(() => {
    if (!homeStop || !stations.length) return null;
    
    for (const station of stations) {
      const stop = station.stops.find((s: StationStop) => s.stopId === homeStop);
      if (stop) {
        return { station, stop };
      }
    }
    
    return null;
  }, [homeStop, stations]);
  
  const favoriteStopDetails = useMemo(() => {
    if (!favoriteStops?.length || !stations.length) return [];
    
    return favoriteStops.map(stopId => {
      if (!stopId) return null;
      
      for (const station of stations) {
        const stop = station.stops.find((s: StationStop) => s.stopId === stopId);
        if (stop) {
          return { station, stop };
        }
      }
      
      return null;
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

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Settings className="h-5 w-5 text-muted-foreground" />
        <h1 className="text-xl font-bold">Settings</h1>
      </div>
      
      {/* Error/Success Message */}
      {(error || statusMessage) && (
        <div className={`p-3 rounded-md ${
          error ? "bg-destructive/10 text-destructive" : 
          statusMessage?.type === "success" ? "bg-green-500/10 text-green-600" : ""
        }`}>
          <p className="text-sm flex items-center">
            {error ? <AlertCircle className="h-4 w-4 mr-2" /> : null}
            {error || statusMessage?.message}
          </p>
        </div>
      )}
      
      {/* Settings Form */}
      <Card>
        <CardHeader>
          <CardTitle>Customize Your Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={saveUserData} className="space-y-4">
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
                disabled={saving || fetching}
                className="bg-primary text-primary-foreground px-4 py-2 rounded"
              >
                {saving ? "Saving..." : "Save Settings"}
              </Button>
              <Button
                type="button"
                onClick={fetchUserData}
                disabled={fetching || saving}
                variant="outline"
                className="ml-4"
              >
                {fetching ? "Loading..." : "Refresh"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      
      {/* Station Selector Modal - Using the StationSelectorModal component */}
      <StationSelectorModal
        isOpen={showStationSelector}
        onClose={closeStationSelector}
        onSelectStop={handleStopSelection}
        stations={stations}
        stationsLoading={stationsLoading}
        title={getModalTitle()}
      />
      
      {/* Feedback Dialog */}
      <FeedbackDialog />
      
      {/* Credits Section */}
      <div className="pt-4 mt-12 mb-4 text-center text-sm text-muted-foreground">
        <p className="px-4">
          brought to you by{" "}
          <a
            href="https://www.declankramper.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline transition-colors duration-200"
          >
            Declan
          </a>
          <i> because Chicagoans deserve a better transit experience</i>
        </p>
      </div>
    </div>
  );
}