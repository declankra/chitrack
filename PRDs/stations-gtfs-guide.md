# Stations Metadata GTFS Guide

This doc explains how we parse CTA's GTFS feed (stops.txt) to get station + platform data.

## 1. Download CTA GTFS
- Official link: https://www.transitchicago.com/downloads/sch_data/google_transit.zip

## 2. Unzip & Parse
We extract `stops.txt` from the ZIP and parse each row as a GtfsStop.

Key columns relevant to CTA rail:
- **stop_id**: Unique ID. Stations (location_type=1) have 4xxxx; platforms (location_type=0) have 3xxxx.
- **parent_station**: 4xxxx station ID for a platform row.
- **stop_desc**: Usually something like "Service toward Loop."
- **direction**: Sometimes "N," "S," "E," "W" or blank. Not always present.
- **stop_name**: Usually just the short station name, e.g. "Southport."

## 3. Building Station & Stop Objects
1. For each row where `location_type=1`, create a new Station.
2. For each row where `location_type=0`, find its `parent_station` to determine which Station it belongs to. Then push a `StationStop` object into the Station's `stops` array.

## 4. Handling Missing Data
- If `stop_desc` is empty, fallback to something like "N/A".
- If `direction` is provided, you can unify it with `stop_desc` or use whichever is more user-friendly.

## 5. Caching
We store this in Redis for 7 days because station metadata rarely changes. The React Query `useStations()` hook also sets a `staleTime: 7 days`.

## 6. Using the Data in the App
- The StationSelectorModal lists stations by `stationName`, then each platform by `stopDesc` or `directionName`.
- On the home screen or search page, the user sees "Service toward Kimball," etc., instead of "N/A".


# Understanding and Processing CTA GTFS Data

## GTFS Overview

The General Transit Feed Specification (GTFS) defines how transit agencies publish their data. CTA provides GTFS files at:
https://www.transitchicago.com/downloads/sch_data/google_transit.zip

## Key Files in GTFS Dataset

1. **stops.txt** - Stations and stops with locations
2. **routes.txt** - Route definitions (Red Line, Blue Line, etc.)
3. **trips.txt** - Individual train trips on routes
4. **stop_times.txt** - Scheduled arrival/departure times

## Stops.txt Structure

This file contains both stations and individual platforms:

```csv
stop_id,stop_name,stop_desc,stop_lat,stop_lon,location_type,parent_station
40360,Southport,CTA Brown Line Station,41.943744,-87.663619,1,
30070,Southport,Service toward Kimball,41.943744,-87.663619,0,40360
30071,Southport,Service toward Loop,41.943744,-87.663619,0,40360
```

### Key fields:

- **stop_id**: Unique identifier (4xxxx for stations, 3xxxx for stops)
- **location_type**: 1=station, 0=platform/stop
- **parent_station**: For stops (location_type=0), references parent station ID
- **stop_desc**: Often contains directional information like "Service toward Loop"
- **direction**: Sometimes present, explicit direction field

## Directional Information Challenges

The main challenge is inconsistent directional data:

- In the best case, stop_desc contains "Service toward [Terminal]"
- Sometimes a direction field is present
- Often, both are missing or uninformative

Our solution applies a multi-step approach:

1. Use explicit fields if available
2. Analyze stop name for directional clues
3. Apply knowledge of CTA line terminals
4. Use meaningful defaults instead of "N/A"

## Mapping to Train Tracker API Data

When we fetch arrival times, we need to associate them with our GTFS-derived stations:

| GTFS Field | Train Tracker API Field |
|------------|-------------------------|
| stop_id (3xxxx) | stpid |
| parent_station | mapid or staid (4xxxx) |
| stop_desc | stpDe |

The API returns `destNm` (final destination) and `rt` (route), which aren't in GTFS but are displayed to users.

## Processing Implementation

Our enhanced `transformStops` function:

- Creates Station objects from location_type=1 entries
- Associates stops (location_type=0) with their parent stations
- Applies smart direction extraction logic
- Ensures every stop has meaningful directional information

The resulting data structure is cached for 7 days and used throughout the app to show station/stop information and fetch relevant arrival times.