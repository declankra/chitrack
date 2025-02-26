/**
 * User Types
 * Centralized type definitions for user data, Supabase database schemas, and related interfaces
 */

/**
 * Core user data interface used throughout the application
 */
export interface UserData {
  userName: string;
  homeStop: string;
  favoriteStops: string[];
  paidUserStatus?: boolean;
}

/**
 * Supabase user data interface matching the chitrack_users table schema
 */
export interface SupabaseUserData {
  userID: string;
  userName?: string;
  homeStop?: string;
  favoriteStops?: string[];
  firstOpenDate?: string;
  paidUserStatus?: boolean;
  [key: string]: unknown;  // Allow for additional properties
}

/**
 * Interface for user feedback data in the chitrack_feedback table
 */
export interface UserFeedback {
  userID: string;
  rating: number;
  feedback: string;
  createdAt?: string;
  [key: string]: unknown;  // Allow for additional properties
}

/**
 * Interface for arrivals data from the CTA API
 */
export interface ArrivalInfo {
  stopId: string;
  stationName: string;
  route: string;
  arrivals: Array<{
    arrT: string;
    destNm: string;
    rt: string;  // Will be cast to RouteColor when used
    isApp: string;
    isDly: string;
  }>;
}

/**
 * Type for favorite stops arrivals mapping
 */
export type FavoriteStopsArrivalsType = Record<string, ArrivalInfo>; 