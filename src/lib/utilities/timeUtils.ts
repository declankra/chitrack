// src/lib/utilities/timeUtils.ts

/**
 * Time utility functions for CTA arrival data
 */

/**
 * Format the relative time since last update
 * @param date Last updated timestamp
 * @param currentTime Current time
 */
export const formatRelativeTime = (date: Date | null, currentTime: Date): string => {
  if (!date) return '';
  const diffMs = currentTime.getTime() - date.getTime();
  const diffMins = Math.round(diffMs / 60000);
  
  if (diffMins < 1) return 'just now';
  return `${diffMins}m ago`;
};

/**
 * Parse CTA arrival time to a Date object
 * @param ctaTime CTA arrival time in "YYYYMMDD HH:mm:ss" or ISO 8601 format
 */
export const parseCtaDate = (ctaTime: string): Date | null => {
  try {
    // Handle ISO-8601 format (e.g. "2025-02-18T12:43:48")
    if (ctaTime.includes('T')) {
      const d = new Date(ctaTime);
      return Number.isNaN(d.getTime()) ? null : d;
    }
    
    // Handle CTA custom format ("YYYYMMDD HH:mm:ss")
    if (!ctaTime || !ctaTime.includes(" ")) {
      return null;
    }
    
    const [datePart, timePart] = ctaTime.split(" ");
    if (!datePart || !timePart) {
      return null;
    }
    
    const year = +datePart.slice(0, 4);
    const month = +datePart.slice(4, 6) - 1;
    const day = +datePart.slice(6, 8);
    const [hour, minute, second] = timePart.split(":").map(Number);

    const d = new Date(year, month, day, hour, minute, second);
    return Number.isNaN(d.getTime()) ? null : d;
  } catch (err) {
    console.error("Error parsing CTA date:", err);
    return null;
  }
};

/**
 * Calculate minutes until arrival
 * @param arrivalTime Arrival time (Date object)
 * @param currentTime Current time (Date object)
 */
export const getMinutesUntil = (arrivalTime: Date, currentTime: Date = new Date()): number => {
  const diffMs = arrivalTime.getTime() - currentTime.getTime();
  return Math.round(diffMs / 60000);
};

/**
 * Format time to display in 12-hour format with AM/PM
 * @param date Date object to format
 */
export const formatTimeDisplay = (date: Date): string => {
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
};

/**
 * Helper to get greeting based on time of day
 */
export const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 6) return 'Good early morning';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};