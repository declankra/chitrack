# Stations Metadata GTFS Guide

This doc explains how we parse CTA’s GTFS feed (stops.txt) to get station + platform data.

## 1. Download CTA GTFS
- Official link: https://www.transitchicago.com/downloads/sch_data/google_transit.zip

## 2. Unzip & Parse
We extract `stops.txt` from the ZIP and parse each row as a GtfsStop.

Key columns relevant to CTA rail:
- **stop_id**: Unique ID. Stations (location_type=1) have 4xxxx; platforms (location_type=0) have 3xxxx.
- **parent_station**: 4xxxx station ID for a platform row.
- **stop_desc**: Usually something like "Service toward Loop."
- **direction**: Sometimes “N,” “S,” “E,” “W” or blank. Not always present.
- **stop_name**: Usually just the short station name, e.g. “Southport.”

## 3. Building Station & Stop Objects
1. For each row where `location_type=1`, create a new Station.
2. For each row where `location_type=0`, find its `parent_station` to determine which Station it belongs to. Then push a `StationStop` object into the Station’s `stops` array.

## 4. Handling Missing Data
- If `stop_desc` is empty, fallback to something like “N/A”.
- If `direction` is provided, you can unify it with `stop_desc` or use whichever is more user-friendly.

## 5. Caching
We store this in Redis for 7 days because station metadata rarely changes. The React Query `useStations()` hook also sets a `staleTime: 7 days`.

## 6. Using the Data in the App
- The StationSelectorModal lists stations by `stationName`, then each platform by `stopDesc` or `directionName`.
- On the home screen or search page, the user sees “Service toward Kimball,” etc., instead of “N/A”.
