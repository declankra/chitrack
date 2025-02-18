/**
 * station.ts
 *
 * Purpose:
 * - Provide client-side functions for fetching and searching station data.
 */

import { 
    Station, 
    ArrivalEta, 
    ArrivalsApiResponse 
} from '@/lib/types/cta';

///////////////////////////////
//  CLIENT-SIDE FUNCTIONS
///////////////////////////////

/**
 * Fetch fresh station data from our API endpoint
 */
export async function fetchStationsDynamic(): Promise<Station[]> {
    try {
        console.log('Fetching stations data from API...');
        const response = await fetch('/api/cta/stations');
        console.log('Stations API response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch station data: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Stations data received:', {
            count: data.length,
            sample: data.slice(0, 2)
        });
        
        return data;
    } catch (error) {
        console.error('Error fetching station data:', error);
        throw error;
    }
}

/**
 * Fetch arrival times for a given station (parent ID).
 */
export async function fetchArrivalsByStation(
    stationId: string,
    apiKey: string,
    maxResults = 3
): Promise<ArrivalEta[]> {
    const url = new URL("http://lapi.transitchicago.com/api/1.0/ttarrivals.aspx");
    url.searchParams.set("key", apiKey);
    url.searchParams.set("mapid", stationId);
    url.searchParams.set("max", String(maxResults));
    url.searchParams.set("outputType", "JSON");
  
    const response = await fetch(url.toString());
    if (!response.ok) {
        throw new Error(`Failed to fetch arrivals: ${response.statusText}`);
    }

    const data = (await response.json()) as ArrivalsApiResponse;
    if (data?.ctatt?.errCd !== "0") {
        throw new Error(
            `CTA API returned errCd=${data.ctatt.errCd}, errNm=${data.ctatt.errNm}`
        );
    }

    return data.ctatt.eta;
}





