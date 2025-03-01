// src/lib/utilities/findStop.ts

import type { Station, StationStop } from '@/lib/types/cta';

/**
 * Find a specific stop and its parent station given a stop ID and stations array
 * @param stopId The stop ID to find
 * @param stations Array of stations to search
 * @returns Object containing the station and stop, or null if not found
 */
export const findStopById = (
  stopId: string,
  stations: Station[]
): { station: Station; stop: StationStop } | null => {
  if (!stopId || !stations.length) return null;
  
  for (const station of stations) {
    const matchingStop = station.stops.find((stop: StationStop) => stop.stopId === stopId);
    if (matchingStop) {
      return { station, stop: matchingStop };
    }
  }
  
  return null;
};

/**
 * Find multiple stops and their parent stations given an array of stop IDs
 * @param stopIds Array of stop IDs to find
 * @param stations Array of stations to search
 * @returns Array of objects containing station and stop pairs
 */
export const findStopsByIds = (
  stopIds: string[],
  stations: Station[]
): Array<{ station: Station; stop: StationStop }> => {
  if (!stopIds?.length || !stations.length) return [];
  
  const results: Array<{ station: Station; stop: StationStop }> = [];
  
  for (const stopId of stopIds) {
    if (!stopId) continue;
    
    const stopInfo = findStopById(stopId, stations);
    if (stopInfo) {
      results.push(stopInfo);
    }
  }
  
  return results;
};

/**
 * Find a specific station by station ID
 * @param stationId The station ID to find
 * @param stations Array of stations to search
 * @returns Station object or null if not found
 */
export const findStationById = (
  stationId: string,
  stations: Station[]
): Station | null => {
  if (!stationId || !stations.length) return null;
  
  return stations.find(station => station.stationId === stationId) || null;
};