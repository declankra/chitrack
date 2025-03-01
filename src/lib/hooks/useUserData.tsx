// src/lib/hooks/useUserData.tsx

import { useState, useEffect, useCallback } from 'react';
import { getSupabase } from '@/lib/supabase';
import type { UserData, SupabaseUserData } from '@/lib/types/user';

interface UseUserDataReturn {
  userData: UserData;
  isLoading: boolean;
  isSaving: boolean;
  error: Error | null;
  statusMessage: { type: 'success' | 'error'; message: string } | null;
  refreshUserData: () => Promise<void>;
  saveUserData: (updatedData: UserData) => Promise<boolean>;
  setStatusMessage: (message: { type: 'success' | 'error'; message: string } | null) => void;
}

/**
 * Custom hook to fetch and manage user data from Supabase
 * @returns Object containing user data, loading state, error state, and data management functions
 */
export const useUserData = (): UseUserDataReturn => {
  const [userData, setUserData] = useState<UserData>({
    userName: 'Traveler',
    homeStop: '',
    favoriteStops: [],
    paidUserStatus: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  // Demo user ID - in a real app this would come from authentication
  const DEMO_USER_ID = "demo-user";
  
  // Fetch user data from Supabase
  const fetchUserData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('chitrack_users')
        .select('*')
        .eq('userID', DEMO_USER_ID)
        .single();
      
      if (error && !data) {
        // User might not exist yet, use default
        console.log('No user data found or error occurred:', error);
        setIsLoading(false);
        return;
      }
      
      if (data) {
        // Cast data to SupabaseUserData type
        const userData = data as unknown as SupabaseUserData;
        setUserData({
          userName: userData.userName || 'Traveler',
          homeStop: userData.homeStop || '',
          favoriteStops: Array.isArray(userData.favoriteStops) ? userData.favoriteStops.filter(Boolean) : [],
          paidUserStatus: userData.paidUserStatus || false,
        });
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch user data'));
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Save user data to Supabase
  const saveUserData = async (updatedData: UserData): Promise<boolean> => {
    setIsSaving(true);
    setError(null);
    
    try {
      const supabase = getSupabase();
      // Filter out empty stops from favoriteStops
      const validFavoriteStops = updatedData.favoriteStops.filter(stop => stop !== "");
      
      const { data, error } = await supabase
        .from('chitrack_users')
        .upsert(
          {
            userID: DEMO_USER_ID,
            userName: updatedData.userName,
            homeStop: updatedData.homeStop,
            favoriteStops: validFavoriteStops,
            paidUserStatus: updatedData.paidUserStatus,
          },
          { onConflict: "userID" }
        )
        .select()
        .single();

      if (error) {
        console.error("Error saving user data:", error);
        setError(new Error('Failed to save settings. Please try again.'));
        return false;
      }
      
      // Update local state with saved data
      if (data) {
        console.log("User updated:", data);
        // Update local user data state
        setUserData({
          userName: updatedData.userName,
          homeStop: updatedData.homeStop,
          favoriteStops: validFavoriteStops,
          paidUserStatus: updatedData.paidUserStatus,
        });
        
        // Set success message
        setStatusMessage({
          type: 'success',
          message: 'Settings saved successfully!',
        });
        
        // Auto-clear success message after 3 seconds
        setTimeout(() => {
          setStatusMessage(null);
        }, 3000);
        
        return true;
      }
      
      return false;
    } catch (err) {
      console.error("Error saving user data:", err);
      setError(err instanceof Error ? err : new Error('Failed to save settings. Please try again.'));
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
  };
};

export default useUserData;