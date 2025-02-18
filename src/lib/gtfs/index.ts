// src/lib/gtfs/index.ts

import fetch from 'node-fetch';
import { createReadStream } from 'fs';
import { createWriteStream } from 'fs';
import { unlink } from 'fs/promises';
import { type File } from 'unzipper';
import * as unzipper from 'unzipper';
import { parse } from 'csv-parse';
import { Station, StationStop } from '@/lib/types/cta';
import { Readable } from 'stream';

const GTFS_TEMP_PATH = '/tmp/cta_gtfs.zip';
const GTFS_URL = 'https://www.transitchicago.com/downloads/sch_data/google_transit.zip';

interface GtfsStop {
    stop_id: string;
    stop_code: string;
    stop_name: string;
    stop_desc: string;
    stop_lat: string;
    stop_lon: string;
    zone_id: string;
    stop_url: string;
    location_type: string;
    parent_station: string;
    stop_timezone: string;
    wheelchair_boarding: string;
    direction: string;
}

/**
 * Downloads the GTFS zip file from CTA
 */
async function downloadGtfsFile(): Promise<void> {
    const response = await fetch(GTFS_URL);
    if (!response.ok || !response.body) {
        throw new Error(`Failed to download GTFS file: ${response.statusText}`);
    }
    
    const fileStream = createWriteStream(GTFS_TEMP_PATH);
    await new Promise<void>((resolve, reject) => {
        const body = response.body as unknown as Readable;
        body.pipe(fileStream);
        body.on("error", reject);
        fileStream.on("finish", resolve);
    });
}

/**
 * Reads stops.txt from the GTFS zip file and returns parsed stops
 */
async function parseStops(): Promise<GtfsStop[]> {
    const stops: GtfsStop[] = [];
    
    const directory = await unzipper.Open.file(GTFS_TEMP_PATH);
    const stopsFile = directory.files.find((d: File) => d.path === 'stops.txt');
    
    if (!stopsFile) {
        throw new Error('stops.txt not found in GTFS file');
    }
    
    const content = await stopsFile.buffer();
    const parser = parse(content, {
        columns: true,
        skip_empty_lines: true
    });
    
    for await (const record of parser) {
        stops.push(record as GtfsStop);
    }
    
    return stops;
}

/**
 * Transforms GTFS stops into our Station format
 */
function transformStops(gtfsStops: GtfsStop[]): Station[] {
    const stationMap = new Map<string, Station>();
    
    // First pass: Create stations
    gtfsStops.forEach(stop => {
        if (stop.location_type === '1') { // This is a station
            stationMap.set(stop.stop_id, {
                stationId: stop.stop_id,
                stationName: stop.stop_name,
                lat: parseFloat(stop.stop_lat),
                lon: parseFloat(stop.stop_lon),
                stops: []
            });
        }
    });
    
    // Second pass: Add stops to stations
    gtfsStops.forEach(stop => {
        if (stop.location_type === '0' && stop.parent_station) { // This is a stop
            const station = stationMap.get(stop.parent_station);
            if (station) {
                station.stops.push({
                    stopId: stop.stop_id,
                    directionName: stop.stop_desc || 'Unknown Direction',
                    parentStationId: stop.parent_station,
                    lat: parseFloat(stop.stop_lat),
                    lon: parseFloat(stop.stop_lon)
                });
            }
        }
    });
    
    return Array.from(stationMap.values());
}

/**
 * Main function to fetch and parse GTFS data
 */
export async function fetchGtfsStations(): Promise<Station[]> {
    try {
        // Download the GTFS file
        await downloadGtfsFile();
        
        // Parse stops from the zip file
        const gtfsStops = await parseStops();
        
        // Transform into our format
        const stations = transformStops(gtfsStops);
        
        // Clean up the temporary file
        await unlink(GTFS_TEMP_PATH);
        
        return stations;
    } catch (error) {
        console.error('Error fetching GTFS data:', error);
        throw error;
    }
} 