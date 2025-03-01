import { useState, useEffect } from 'react';

/**
 * Hook to manage refresh animation state
 * Ensures a single spin animation occurs on refresh click, even with cached data
 * 
 * @returns {Object} Animation state and trigger function
 */
export function useRefreshAnimation() {
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Reset animation state after animation completes
  useEffect(() => {
    if (isAnimating) {
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 750); // Animation duration
      
      return () => clearTimeout(timer);
    }
  }, [isAnimating]);
  
  // Function to trigger animation
  const triggerAnimation = () => {
    setIsAnimating(true);
  };
  
  return {
    isAnimating,
    triggerAnimation
  };
} 