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
        throw new Error('Unable to fetch station data. Please check your internet connection and try refreshing the page.');
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
        throw error; // Re-throw the error to be handled by the API route
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
        return NextResponse.json({ 
            error: 'Unable to fetch station data. Please check your internet connection and try refreshing the page.',
            code: 'CONNECTION_ERROR'
        }, { status: 500 });
    }
}
