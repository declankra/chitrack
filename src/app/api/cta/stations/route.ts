// src/app/api/cta/stations/route.ts
import { NextResponse } from 'next/server';
import { Station } from '@/lib/types/cta';
import { fetchGtfsStations } from '@/lib/gtfs';

export const dynamic = 'force-dynamic';

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
 * Main function to retrieve station data, now directly fetches fresh data.
 */
async function fetchStationsDirectly(): Promise<Station[]> {
    try {
        console.log('Fetching fresh station data directly...');
        // Fetch fresh data
        const stations = await fetchFreshStationData();
        console.log('Fresh stations data fetched:', {
            count: stations.length
        });
        return stations;
    } catch (error) {
        console.error('Error fetching station data:', error);
        // Return fallback data if fetch fails
        console.log('Returning fallback station data due to error');
        // Reuse the fallback logic from the original fetchFreshStationData error handling
        // Or define a simpler fallback if preferred
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
 * GET handler for /api/cta/stations
 * Returns station data by directly fetching fresh data
 */
export async function GET() {
    try {
        console.log('Stations API endpoint called - fetching directly');
        const stations = await fetchStationsDirectly();
        
        return NextResponse.json(stations);
    } catch (error) {
        console.error('Error in stations API route:', error);
        return NextResponse.json({ error: 'Failed to fetch station data' }, { status: 500 });
    }
}
