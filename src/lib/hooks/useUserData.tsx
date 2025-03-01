// src/lib/hooks/useUserData.tsx

import { useState, useEffect, useCallback } from 'react';
import { getSupabase } from '@/lib/supabase';
import type { UserData, SupabaseUserData } from '@/lib/types/user';

/**
 * Custom hook to fetch and manage user data from Supabase
 * @returns Object containing user data, loading state, error state, and refresh function
 */
export const useUserData = () => {
  const [userData, setUserData] = useState<UserData>({
    userName: 'Traveler',
    homeStop: '',
    favoriteStops: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Fetch user data from Supabase
  const fetchUserData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('chitrack_users')
        .select('*')
        .eq('userID', 'demo-user')  // Using demo user for simplicity
        .single();
      
      if (error && !data) {
        // User might not exist yet, use default
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
        });
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch user data'));
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Load user data on hook mount
  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);
  
  return {
    userData,
    isLoading,
    error,
    refreshUserData: fetchUserData
  };
};

export default useUserData;