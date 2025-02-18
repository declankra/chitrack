// src/app/api/cta/stations/route.ts
import { NextResponse } from 'next/server';
import redis from '@/lib/redis';
import { Station } from '@/lib/types/cta';
import { fetchGtfsStations } from '@/lib/gtfs';

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
                        directionName: "Service toward Kimball",
                        parentStationId: "40360",
                        lat: 41.943744,
                        lon: -87.663619,
                    },
                    {
                        stopId: "30071",
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
                        directionName: "Service toward 95th/Dan Ryan",
                        parentStationId: "41320",
                        lat: 42.019063,
                        lon: -87.672892,
                    },
                    {
                        stopId: "30171",
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
        // First try to get from cache
        const cachedStations = await getCachedStations();
        if (cachedStations) {
            console.log('Retrieved stations from cache');
            return cachedStations;
        }

        // If not in cache, fetch fresh data
        console.log('Cache miss - fetching fresh station data');
        const stations = await fetchFreshStationData();
        
        // Cache the fresh data for next time
        await cacheStationData(stations);
        
        return stations;
    } catch (error) {
        console.error('Error fetching station data:', error);
        // If all else fails, return example data as fallback
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
        const stations = await fetchStationsDynamic();
        return NextResponse.json(stations);
    } catch (error) {
        console.error('Error in stations API route:', error);
        return NextResponse.json({ error: 'Failed to fetch station data' }, { status: 500 });
    }
}
