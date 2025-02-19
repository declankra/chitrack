// src/app/api/cta/stations/route.ts
import { NextResponse } from 'next/server';
import redis from '@/lib/redis';
import { Station } from '@/lib/types/cta';
import { fetchGtfsStations } from '@/lib/gtfs';

export const dynamic = 'force-dynamic';

// Redis cache configuration
const STATIONS_CACHE_KEY = 'CTA_STATIONS_DATA';
const CACHE_TTL_SECONDS = 24 * 60 * 60; // 24 hours

/**
 * Fetch fresh station data from CTA GTFS feed
 * This function downloads and parses the GTFS feed to get station information
 */
async function fetchFreshStationData(): Promise<Station[]> {
    try {
        // Fetch and parse GTFS data
        const stations = await fetchGtfsStations();
        
        if (!stations || stations.length === 0) {
            throw new Error('No stations found in GTFS data');
        }
        
        return stations;
    } catch (error) {
        console.error('Error fetching fresh station data:', error);
        // If GTFS fetch fails, return example data as fallback
        return [
            {
                stationId: "40360",
                stationName: "Southport",
                lat: 41.943744,
                lon: -87.663619,
                stops: [
                    {
                        stopId: "30070",
                        stopName: "Southport",
                        stopDesc: "Service toward Kimball",
                        directionName: "Service toward Kimball",
                        parentStationId: "40360",
                        lat: 41.943744,
                        lon: -87.663619,
                    },
                    {
                        stopId: "30071",
                        stopName: "Southport",
                        stopDesc: "Service toward Loop",
                        directionName: "Service toward Loop",
                        parentStationId: "40360",
                        lat: 41.943744,
                        lon: -87.663619,
                    },
                ],
            },
            {
                stationId: "41320",
                stationName: "Howard",
                lat: 42.019063,
                lon: -87.672892,
                stops: [
                    {
                        stopId: "30170",
                        stopName: "Howard",
                        stopDesc: "Service toward 95th/Dan Ryan",
                        directionName: "Service toward 95th/Dan Ryan",
                        parentStationId: "41320",
                        lat: 42.019063,
                        lon: -87.672892,
                    },
                    {
                        stopId: "30171",
                        stopName: "Howard",
                        stopDesc: "Terminal arrival",
                        directionName: "Terminal arrival",
                        parentStationId: "41320",
                        lat: 42.019063,
                        lon: -87.672892,
                    },
                ],
            },
        ];
    }
}

/**
 * Cache station data in Redis
 */
async function cacheStationData(stations: Station[]): Promise<void> {
    try {
        await redis.setex(STATIONS_CACHE_KEY, CACHE_TTL_SECONDS, JSON.stringify(stations));
        console.log(`Successfully cached ${stations.length} stations for 24 hours`);
    } catch (error) {
        console.error('Failed to cache station data:', error);
    }
}

/**
 * Retrieve cached station data from Redis
 */
async function getCachedStations(): Promise<Station[] | null> {
    try {
        const cachedData = await redis.get(STATIONS_CACHE_KEY);
        if (!cachedData) return null;
        return JSON.parse(cachedData) as Station[];
    } catch (error) {
        console.error('Failed to retrieve cached station data:', error);
        return null;
    }
}

/**
 * Main function to retrieve station data, using cache when available
 * and falling back to fresh API fetch when needed.
 */
async function fetchStationsDynamic(): Promise<Station[]> {
    try {
        console.log('Attempting to fetch stations data...');
        // First try to get from cache
        const cachedStations = await getCachedStations();
        if (cachedStations) {
            console.log('Retrieved stations from cache:', {
                count: cachedStations.length
            });
            return cachedStations;
        }

        // If not in cache, fetch fresh data
        console.log('Cache miss - fetching fresh station data');
        const stations = await fetchFreshStationData();
        
        // Cache the fresh data for next time
        await cacheStationData(stations);
        console.log('Fresh stations data fetched and cached:', {
            count: stations.length
        });
        
        return stations;
    } catch (error) {
        console.error('Error fetching station data:', error);
        // If all else fails, return example data as fallback
        console.log('Returning fallback station data');
        const fallbackData = await fetchFreshStationData();
        return fallbackData;
    }
}

/**
 * GET handler for /api/cta/stations
 * Returns station data from cache or fetches fresh data
 */
export async function GET() {
    try {
        console.log('Stations API endpoint called');
        const stations = await fetchStationsDynamic();
        console.log('Stations data fetched:', {
            count: stations.length,
            sample: stations.slice(0, 2)
        });
        return NextResponse.json(stations);
    } catch (error) {
        console.error('Error in stations API route:', error);
        return NextResponse.json({ error: 'Failed to fetch station data' }, { status: 500 });
    }
}
