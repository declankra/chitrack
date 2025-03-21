import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// Helper for React Native compatibility
export const isPlatformNative = () => {
  if (typeof window === 'undefined') return false; // Server-side rendering
  return typeof navigator !== 'undefined' && 
         (navigator.product === 'ReactNative' || window.navigator.userAgent === 'RNDebugger');
};

// Platform-specific timer implementation for React Native compatibility
const createPlatformTimer = (callback: () => void, interval: number): { clear: () => void } => {
  if (isPlatformNative()) {
    // React Native implementation
    const timerId = setInterval(callback, interval);
    return {
      clear: () => clearInterval(timerId as unknown as number),
    };
  } else {
    // Web implementation
    const timerId = window.setInterval(callback, interval);
    return {
      clear: () => window.clearInterval(timerId),
    };
  }
};

// Interface for time context
interface TimeContextType {
  currentTime: Date;
  lastRefreshTime: Date | null;
  updateLastRefreshTime: () => void;
}

// Create context with default values
const TimeContext = createContext<TimeContextType>({
  currentTime: new Date(),
  lastRefreshTime: null,
  updateLastRefreshTime: () => {},
});

/**
 * TimeProvider Component - Provides centralized time management across the app
 * Maintains a single timer for all components
 */
export function TimeProvider({ children }: { children: React.ReactNode }) {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  
  // Update time frequently to keep UI in sync
  useEffect(() => {
    // Update immediately to start with current time
    setCurrentTime(new Date());
    
    // Create a platform-specific timer that works in both web and React Native
    // Update every 5 seconds for more responsive UI
    const timer = createPlatformTimer(() => {
      setCurrentTime(new Date());
    }, 5000); // 5 seconds
    
    // Cleanup timer on unmount
    return () => timer.clear();
  }, []);
  
  // Function to update last refresh time
  const updateLastRefreshTime = useCallback(() => {
    setLastRefreshTime(new Date());
  }, []);
  
  const value = {
    currentTime,
    lastRefreshTime,
    updateLastRefreshTime,
  };
  
  return (
    <TimeContext.Provider value={value}>
      {children}
    </TimeContext.Provider>
  );
}

// Custom hook to use the time context
export function useTime() {
  const context = useContext(TimeContext);
  if (context === undefined) {
    throw new Error('useTime must be used within a TimeProvider');
  }
  return context;
} 