# Search Page

## Overview
The Search page should let a user search for a station and see the arrival times at that station.

## User Stories
- The user can search for a station (stop) and see an auto-updating matched results list above the search bar of the top three matches they type
- The user can select a station (stop from the list) and see the header group for direction (stopName) and then the sub-header group for each line (route) (e.g. brown, red, etc.) with the next three arrival times listed

## Requirements
- Display both the time calculations (minutes till arrival) and time of arrival when listing arrival times
- Make sure the solution returns proper information if the train is delayed, approaching, or other error codes
- The human-friendly stop description is included
- The route color is added to the header group according to the line color
- Before a station is selected, center H1 text on the page with a subtitle saying to search for a station

## Technical Implementation Notes
- Use // src/app/api/cta/arrivals/station/route.ts api route for fetching station-level arrival time data at a particular station
- Ensure the arrival times cacheing layer logic is utilized
- Use the cache station metadata thats initiated in the root src layout as a source for search data
- Take note of the structure of our station data
- Use a helper function for the search station logic
- All types are defined in the cta.ts
- UseStations react query hook for getting station data

## Current Flow

### Station Data Fetch
1. A custom React Query hook (useStations()) at the (app) root level src/app/layout.tsx triggers a call to /api/cta/stations (Next.js API route)
2. The /api/cta/stations endpoint returns a list of stations from Redis (if cached) or the CTA GTFS feed (if not)
3. The front end caches the station list in React Query

### Search Input (Navigation Dock)
1. As the user types in the dock's search box, the component filters the already-fetched station list (from React Query) based on the user query
2. The top three matched stations are rendered in a small dropdown above the dock

### Selecting a Station
1. When the user selects a station from the dropdown, a stationSelected custom event is dispatched
2. The Search page listens for this event, setting the selected station in its state

### Fetching Arrival Times
1. Once a station is selected, the Search page calls /api/cta/arrivals/station?stations=<stationId>
2. That endpoint uses Redis to cache real-time arrival data from the CTA
3. It returns up to three upcoming arrivals per stopID/directionName
4. The Search page takes the arrival data and uses ArrivalBoard.tsx to format these arrivals by route (e.g., Brown/Red/Green lines), showing how many minutes until arrival, whether they are delayed or approaching, and the scheduled time

### Displaying Results
- If a station is selected, the Search page displays direction headings, route color highlights, the next arrivals (due time plus actual time), and any relevant status flags
- If no station is selected, it shows a centered "Find Your Station" message