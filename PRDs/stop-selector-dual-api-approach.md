# Stop Selector: Dual-API Approach Synopsis

This approach combines static GTFS station data with real-time arrivals data to provide a more intuitive and accurate stop selection experience.

## Data Sources

1.  **Static GTFS Data:**
    *   Fetched via `/api/cta/stations`.
    *   Processed from the `google_transit.zip` file (`stops.txt`).
    *   Defines the list of all **stations** (L1) and their associated **stops** (platforms/locations).
    *   Often lacks descriptive direction names (`directionName` frequently defaults to "N/A" for stops in the source data).
    *   Used as the initial source for station selection and as a fallback.

2.  **Real-time Arrivals API:**
    *   Fetched via `/api/cta/arrivals/station?stations={stationId}`.
    *   Provides live train arrival predictions for a specific station.
    *   The response structure used is `[{ stationId, stationName, stops: [{ stopId, stopName, route, arrivals: [...] }] }]`.
    *   Contains descriptive **stop names** (`stopName` like "Service toward Howard") which represent the active directions.
    *   Also provides the **route** (`route`) for color coding.
    *   Used to populate the direction selection list (L2).

## Component Logic

### `StopSelectorModal.tsx`

*   **L1 - Station List:**
    *   Populated using the `stations` prop (derived from **Static GTFS Data**).
    *   Displays `station.stationName`.
*   **L2 - Direction List:**
    1.  When an L1 station is selected, it fetches **Real-time Arrivals API** data for that `stationId`.
    2.  It processes the `stops` array within the API response.
    3.  It displays a list using `stop.stopName` (the descriptive direction) and `stop.route` (for the color indicator via `RouteIndicator`).
    4.  **Fallback:** If the arrivals API call fails or returns no currently active stops, it falls back to displaying stops from the **Static GTFS Data** (using `stop.directionName`, which might be "N/A").
    5.  **"Active Only" Note:** An info icon clarifies that the list primarily shows directions with current service, explaining why some statically defined stops might be missing.
*   **Selection (`onSelectStop`):**
    *   When an L2 direction is chosen, it passes an object `{ stopId, stationId, directionName }` to the parent component (`SettingsForm`).
    *   `directionName` here is the descriptive name (`stop.stopName`) shown in the L2 list.

### `SettingsForm.tsx`

*   **Receiving Selection:** Handles the `{ stopId, stationId, directionName }` object from the modal.
*   **Saving Data:** Persists only the selected `stopId` (for `homeStop` or `favoriteStops`).
*   **Displaying Selection:**
    *   Uses *temporary state* (`tempHomeStopInfo`, `tempFavoriteStopInfo`) to immediately display the `stationName` and `directionName` received from the modal after selection.
    *   On initial load or after a data refresh, it falls back to using `findStopById` with the saved `stopId` to look up details in the **Static GTFS Data**.

### Display Components (`HomeStopSection.tsx`, `FavoriteStopCard.tsx`)

*   **Fetching:** These components fetch their *own* live arrival data for the relevant `stopId` using hooks (e.g., `useStopArrivals`).
*   **Header Display:**
    *   They primarily display the station name (`arrival.staNm`) and direction (`arrival.stpDe`) derived from the **first available live arrival** they fetched.
    *   **Fallback:** If no live arrivals are currently available for the stop, they fall back to displaying the station and direction names derived from the **Static GTFS Data** (looked up via `findStopById` or passed as props).
*   **Arrival List:** Displays the list of upcoming trains based on the live arrival data fetched by the component itself.

## Summary Flow

1.  User sees stations (L1) from GTFS data in the modal.
2.  User selects a station.
3.  Modal fetches live arrivals for that station.
4.  Modal displays directions (L2) using `stopName` and `route` from the arrivals response (with GTFS fallback).
5.  User selects a direction.
6.  Modal sends `{ stopId, stationId, directionName }` to `SettingsForm`.
7.  `SettingsForm` saves `stopId` and uses temporary state + received `directionName` for immediate display.
8.  `HomeStopSection`/`FavoriteStopCard` independently fetch live arrivals for the saved `stopId` and display `staNm`/`stpDe` from that data (with GTFS fallback).