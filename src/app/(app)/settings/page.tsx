// src/app/(app)/settings/page.tsx

"use client";

import React from "react";
import { useStations } from "@/lib/hooks/useStations";
import { useUserData } from "@/lib/hooks/useUserData";
import { Settings, AlertCircle } from "lucide-react";
import FeedbackDialog from "@/components/shared/FeedbackDialog";
import SettingsForm from "@/components/settings/SettingsForm";
import type { UserData } from "@/lib/types/user";

export default function SettingsPage() {
  // Use enhanced useUserData hook that includes saving functionality
  const {
    userData,
    isLoading: isFetching,
    isSaving,
    error,
    statusMessage,
    refreshUserData,
    saveUserData
  } = useUserData();

  // Fetch station data
  const { data: stations = [], isLoading: stationsLoading } = useStations();

  // Handle form submission
  const handleSaveUserData = async (updatedData: UserData) => {
    await saveUserData(updatedData);
  };

  // Handle refresh user data
  const handleRefreshUserData = async () => {
    await refreshUserData();
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
            {error?.message || statusMessage?.message}
          </p>
        </div>
      )}
      
      {/* Settings Form Component */}
      <SettingsForm
        userData={userData}
        stations={stations}
        stationsLoading={stationsLoading}
        isSaving={isSaving}
        isFetching={isFetching}
        onSave={handleSaveUserData}
        onRefresh={handleRefreshUserData}
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