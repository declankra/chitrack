// Function to test stop arrivals
export async function testStopArrivals() {
  try {
    // First, fetch all stations to get the stop IDs
    const stationsResponse = await fetch('/api/cta/stations');
    if (!stationsResponse.ok) {
      throw new Error(`Stations API returned ${stationsResponse.status}: ${stationsResponse.statusText}`);
    }

    const stations = await stationsResponse.json();

    // Extract all stops from stations
    const allStops = stations.reduce((stops: Array<{id: string, name: string}>, station: any) => {
      // Each station has a stops array
      station.stops.forEach((stop: any) => {
        stops.push({
          id: stop.stopId,
          name: `${station.stationName} - Stop ${stop.stopId}`,
        });
      });
      return stops;
    }, []);

    // Select a random stop for testing
    const randomStop = allStops[Math.floor(Math.random() * allStops.length)];

    // Fetch arrivals for the selected stop
    const response = await fetch(`/api/cta/arrivals/stop?stopId=${randomStop.id}`);
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      metadata: {
        testedStop: randomStop.id,
        stopName: randomStop.name,
        totalStops: allStops.length,
      },
      stopIds: allStops,
      data: data
    };

  } catch (error) {
    throw error;
  }
} 