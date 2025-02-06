// src/app/settings/page.tsx

"use client";

import React, { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";

// Add this interface near the top of the file
interface UserData {
  userName: string;
  homeStop: string;
  favoriteStops: string[];
  paidUserStatus: boolean;
}

export default function Settings() {
  // Simulate or determine userID in a real project:
  // This might come from authentication or a unique device ID.
  // For demonstration, we use a fixed "demo-user".
  const DEMO_USER_ID = "demo-user";

  // Local state for user data
  const [userName, setUserName] = useState("");
  const [homeStop, setHomeStop] = useState("");
  const [favoriteStops, setFavoriteStops] = useState([""]);
  const [paidUserStatus, setPaidUserStatus] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [saving, setSaving] = useState(false);

  // On component mount, fetch user data
  useEffect(() => {
    fetchUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch user info from Supabase
  const fetchUserData = async () => {
    try {
      setFetching(true);
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
        setFavoriteStops(userData.favoriteStops || [""]);
        setPaidUserStatus(userData.paidUserStatus || false);
      }
    } catch (err) {
      console.error("Error fetching user data:", err);
    } finally {
      setFetching(false);
    }
  };

  // Save user info to Supabase
  const saveUserData = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("chitrack_users")
        .upsert(
          {
            userID: DEMO_USER_ID,
            userName,
            homeStop,
            favoriteStops,
            paidUserStatus,
          },
          { onConflict: "userID" }
        )
        .select()
        .single();

      if (error) {
        console.error("Error saving user data:", error);
      } else {
        // Reflect saved state
        if (data) {
          console.log("User updated:", data);
        }
      }
    } catch (err) {
      console.error("Error saving user data:", err);
    } finally {
      setSaving(false);
    }
  };

  // Utility to handle updating an individual favorite stop in the array
  const handleFavoriteStopChange = (
    index: number,
    value: string
  ) => {
    const updatedFavorites = [...favoriteStops];
    updatedFavorites[index] = value;
    setFavoriteStops(updatedFavorites);
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

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold mb-2">Settings</h1>
      <Card>
        <CardHeader>
          <CardTitle>Customize Your Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={saveUserData} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                User Name
              </label>
              <input
                className="border border-border rounded px-3 py-2 w-full"
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Home Stop
              </label>
              <input
                className="border border-border rounded px-3 py-2 w-full"
                type="text"
                value={homeStop}
                onChange={(e) => setHomeStop(e.target.value)}
              />
            </div>
            {/* Favorite Stops */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Favorite Stops (up to 3)
              </label>
              {favoriteStops.map((stop, idx) => (
                <div key={idx} className="flex items-center mb-2">
                  <input
                    className="border border-border rounded px-3 py-2 w-full"
                    type="text"
                    value={stop}
                    onChange={(e) =>
                      handleFavoriteStopChange(idx, e.target.value)
                    }
                  />
                  {favoriteStops.length > 1 && (
                    <button
                      type="button"
                      className="ml-2 text-destructive-foreground px-3 py-2"
                      onClick={() => removeFavoriteStopField(idx)}
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              {favoriteStops.length < 3 && (
                <button
                  type="button"
                  className="mt-2 text-primary hover:underline"
                  onClick={addFavoriteStopField}
                >
                  Add Another Favorite Stop
                </button>
              )}
            </div>
            {/* Paywall Status (Web Not Enforced) */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Paid User
              </label>
              <input
                type="checkbox"
                checked={paidUserStatus}
                onChange={(e) => setPaidUserStatus(e.target.checked)}
              />
              <p className="text-xs text-muted-foreground">
                This field is only enforced in the SwiftUI app version.
              </p>
            </div>
            {/* Actions */}
            <div className="flex items-center justify-between mt-4">
              <button
                type="submit"
                disabled={saving}
                className="bg-primary text-primary-foreground px-4 py-2 rounded"
              >
                {saving ? "Saving..." : "Save Settings"}
              </button>
              <button
                type="button"
                onClick={fetchUserData}
                disabled={fetching}
                className="ml-4 border border-border px-4 py-2 rounded"
              >
                {fetching ? "Fetching..." : "Refresh Data"}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

