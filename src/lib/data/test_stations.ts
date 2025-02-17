/**
 * Test utility to fetch arrivals for stations one at a time
 * Client-side utility for testing station arrivals
 */
export async function testAllStationArrivals() {
  console.time('fetchAllStations');
  
  try {
    // Fetch station IDs from stations API
    const stationsResponse = await fetch('/api/cta/stations');
    if (!stationsResponse.ok) {
      throw new Error('Failed to fetch stations');
    }
    const stations = await stationsResponse.json();
    const stationIds = stations.map((station: any) => station.stationId);
    
    console.log(`Testing with ${stationIds.length} stations, one at a time`);
    
    // Get a random station ID
    const randomIndex = Math.floor(Math.random() * stationIds.length);
    const randomStationId = stationIds[randomIndex];
    
    // Test arrivals for the random station
    const arrivalsResponse = await fetch(
      `/api/cta/arrivals/station?stations=${randomStationId}`,
      { 
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );

    const data = await arrivalsResponse.json();
    
    console.timeEnd('fetchAllStations');
    console.log('Response status:', arrivalsResponse.status);
    console.log('Testing station:', randomStationId);
    console.log('Total response size:', JSON.stringify(data).length, 'bytes');
    
    return {
      data,
      stationIds,
      metadata: {
        totalStations: stationIds.length,
        testedStation: randomStationId,
        responseSize: JSON.stringify(data).length,
      }
    };
  } catch (error) {
    console.error('Test failed:', error);
    throw error;
  }
} 