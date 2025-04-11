// src/lib/hooks/useUserData.tsx

import { useState, useEffect, useCallback } from 'react';
import { getSupabase } from '@/lib/supabase';
import type { UserData, SupabaseChitrackUser, StopInfo } from '@/lib/types/user';
// No longer need uuid

interface UseUserDataReturn {
  userData: UserData | null;
  isLoading: boolean;
  isSaving: boolean;
  error: Error | null;
  statusMessage: { type: 'success' | 'error'; message: string } | null;
  refreshUserData: () => Promise<void>;
  saveUserData: (updatedFields: Partial<Omit<UserData, 'deviceId' | 'userId' | 'createdAt' | 'updatedAt' | 'firstOpenDate'>>) => Promise<boolean>;
  setStatusMessage: (message: { type: 'success' | 'error'; message: string } | null) => void;
  // Removed getDeviceId
}

// Define the fixed device ID for the web application
const WEBAPP_DEVICE_ID = "webapp-main-user";

/**
 * Custom hook to fetch and manage a single user data record for the web app from Supabase.
 * @returns Object containing user data, loading state, error state, and data management functions
 */
export const useUserData = (): UseUserDataReturn => {
  // userData state remains the same
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Fetch user data from Supabase based on the fixed WEBAPP_DEVICE_ID
  const fetchUserData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = getSupabase();
      const { data, error: fetchError } = await supabase
        .from('chitrack_users')
        .select('*')
        .eq('device_id', WEBAPP_DEVICE_ID) // Use fixed ID
        .maybeSingle();

      if (fetchError) {
        console.error('Error fetching web app user data:', fetchError);
        setError(fetchError);
        setUserData(null);
        return;
      }

      if (data) {
        const dbData = data as SupabaseChitrackUser;
        setUserData({
          userId: dbData.user_id,
          deviceId: dbData.device_id, // Should always be WEBAPP_DEVICE_ID
          userName: dbData.user_name,
          homeStop: dbData.home_stop ? dbData.home_stop : null,
          favoriteStops: dbData.favorite_stops ? dbData.favorite_stops : [],
          paidUserStatus: dbData.paid_user_status ?? false,
          firstOpenDate: dbData.first_open_date ? new Date(dbData.first_open_date) : null,
          createdAt: dbData.created_at ? new Date(dbData.created_at) : null,
          updatedAt: dbData.updated_at ? new Date(dbData.updated_at) : null,
        });
      } else {
        // Web app user does not exist yet in the database.
        console.log('No user data found for the web app. Will create on first save.');
        // Set a minimal local state, actual DB record created on first saveUserData call
        setUserData({
          deviceId: WEBAPP_DEVICE_ID,
          paidUserStatus: false, // Default paid status
          favoriteStops: [],
          // Other fields will be default null/undefined
        });
      }
    } catch (err) {
      console.error('Error in fetchUserData processing:', err);
      setError(err instanceof Error ? err : new Error('Failed to process user data'));
      setUserData(null);
    } finally {
      setIsLoading(false);
    }
  }, []); // No dependency on deviceId anymore

  // Save user data to Supabase for the fixed WEBAPP_DEVICE_ID
  const saveUserData = async (updatedFields: Partial<Omit<UserData, 'deviceId' | 'userId' | 'createdAt' | 'updatedAt' | 'firstOpenDate'>>): Promise<boolean> => {
    // Use the current state as the base, ensuring we have a deviceId (the fixed one)
    const baseData = userData ?? { deviceId: WEBAPP_DEVICE_ID, paidUserStatus: false, favoriteStops: [] }; 

    setIsSaving(true);
    setError(null);
    setStatusMessage(null);

    try {
      const supabase = getSupabase();

      // Prepare data for upsert (snake_case) using the fixed ID
      const dataToSave: Partial<SupabaseChitrackUser> = {
        device_id: WEBAPP_DEVICE_ID, // Always use the fixed ID
        user_name: updatedFields.userName !== undefined ? updatedFields.userName : baseData.userName,
        home_stop: updatedFields.homeStop !== undefined ? updatedFields.homeStop : baseData.homeStop,
        favorite_stops: updatedFields.favoriteStops !== undefined
            ? updatedFields.favoriteStops?.filter((stop): stop is StopInfo => stop !== null) ?? []
            : baseData.favoriteStops?.filter((stop): stop is StopInfo => stop !== null) ?? [],
        paid_user_status: updatedFields.paidUserStatus !== undefined ? updatedFields.paidUserStatus : baseData.paidUserStatus,
      };

      // Set first_open_date only if it doesn't exist in the base data (meaning it's the first save)
      if (!baseData.firstOpenDate) {
         dataToSave.first_open_date = new Date().toISOString();
      }

      const { data: savedData, error: saveError } = await supabase
        .from('chitrack_users')
        .upsert(dataToSave, { onConflict: 'device_id' }) // Use device_id for conflict
        .select()
        .single();

      if (saveError) {
        console.error("Error saving web app user data:", saveError);
        setError(new Error('Failed to save settings. Please try again.'));
        setStatusMessage({ type: 'error', message: 'Failed to save.' });
        return false;
      }

      if (savedData) {
        const dbData = savedData as SupabaseChitrackUser;
        console.log("Web app user data saved/updated:", dbData);
        // Update local state with the full data from DB
        setUserData({
          userId: dbData.user_id,
          deviceId: dbData.device_id,
          userName: dbData.user_name,
          homeStop: dbData.home_stop ? dbData.home_stop : null,
          favoriteStops: dbData.favorite_stops ? dbData.favorite_stops : [],
          paidUserStatus: dbData.paid_user_status ?? false,
          firstOpenDate: dbData.first_open_date ? new Date(dbData.first_open_date) : null,
          createdAt: dbData.created_at ? new Date(dbData.created_at) : null,
          updatedAt: dbData.updated_at ? new Date(dbData.updated_at) : null,
        });

        setStatusMessage({
          type: 'success',
          message: 'Settings saved successfully!',
        });

        setTimeout(() => {
          setStatusMessage(null);
        }, 3000);

        return true;
      }

      return false;
    } catch (err) {
      console.error("Error processing save user data:", err);
      setError(err instanceof Error ? err : new Error('Failed to save settings. Please try again.'));
      setStatusMessage({ type: 'error', message: 'Save failed unexpectedly.' });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // Load user data on hook mount
  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  return {
    userData,
    isLoading,
    isSaving,
    error,
    statusMessage,
    refreshUserData: fetchUserData,
    saveUserData,
    setStatusMessage,
    // getDeviceId removed
  };
};

export default useUserData;