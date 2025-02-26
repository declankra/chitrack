# ChiTrack Home Page

## Overview
The Home page provides users with personalized, at-a-glance access to real-time train arrivals for their most important stops, creating a frictionless transit experience.

## Problem Statement
Transit users need immediate access to arrival times for their frequently used stations without navigating through complex menus or searching repeatedly. Current transit apps require too many interactions to access this critical information, causing delays and frustration during time-sensitive commutes.

## Goals
- **Business Goal**: Increase user retention by providing an elegant, efficient home screen that delivers immediate value, encouraging daily app usage and eventual conversion to paid iOS app users.
- **User Goal**: Reduce time-to-information by showing personalized, real-time arrivals for the user's most important stops immediately upon app launch.
- **Non-Goals**: We are not building comprehensive station information (maps, accessibility details) or trip planning functionality in this phase.

## User Stories
- As a daily commuter, I can see arrival times for my home station immediately upon opening the app, so I know exactly when to leave.
- As a transit user, I can refresh arrival times with a single tap, so I always have the most current information.
- As a flexible traveler, I can quickly view arrivals for up to three favorite stops, so I can check alternate routes without searching.
- As a new user, I am prompted to set up my preferences, so the app becomes personalized to my transit needs.
- As a user with changing needs, I can access settings to update my home stop and favorite stops, so my home screen stays relevant.

## Requirements
- Display a personalized greeting that includes the user's name if set in settings
- Show a clear, prominent section for the user's home stop with:
  - Station name and direction information
  - Next three train arrivals with line color, destination, and arrival times (both relative minutes and actual time)
  - Visual indicators for delayed or approaching trains
  - One-touch refresh button with loading indicator
- Present up to three favorite stops with similar arrival information in a compact format
- Provide visual feedback when arrival data is being refreshed
- Handle empty states gracefully when no home/favorite stops are set
- Include clear CTAs to guide users to set up their preferences if not already configured
- Support for dark/light mode following system preferences
- Maintain proper error states with retry options if data fetching fails

## Technical Implementation Notes
- **Data Sources**:
  - Use `useStations` hook from `/src/lib/hooks/useStations.ts` to access station data
  - User preferences from local storage and/or Supabase via `getSupabase()` function
  - Fetch arrivals from `/api/cta/arrivals/station?stations={stationId}` and `/api/cta/arrivals/stop?stopId={stopId}`
- **Caching Strategy**:
  - Leverage the existing 30-second Redis cache from the API routes
  - Implement a client-side cache with React Query to prevent unnecessary re-fetching
  - Display cached data immediately while refreshing in the background
- **Data Models**:
  - Follow the `Station`, `StationStop`, `Arrival` interfaces from `/src/lib/types/cta.ts`
  - Store user preferences using the structure from the Settings page (`src/app/(app)/settings/page.tsx`)
- **Component Structure**:
  - Adapt existing `HomeScreen.tsx` from `/src/components/utilities/HomeScreen.tsx`
  - Reuse similar design elements from the `ArrivalBoard` component from the Search page with modifications for compact display
  - Create a new `StopSelector` component that can be shared between Home and Settings

## User Experience & Flow
1. **First Launch**:
   - User sees empty home page with friendly welcome message
   - Clear guidance prompts user to set up home stop and favorite stops
   - Links direct user to the Settings page to configure preferences

2. **Selecting/Manaing stop in settings**:
   - User sets home stop and favorite stops using the StopSelectorModal
   - The StopSelectorModal should allow user to find their favorite stops by filtering by L1: station name > L2: stop description
   - User can add/remove favorite stops

3. **Returning User (Configured)**:
   - Personalized greeting appears with user's name
   - Home stop section automatically loads latest arrival data
   - Favorite stops display in compact cards below
   - All arrival times update every minute to reflect countdown

3. **Data Interaction**:
   - User can tap refresh button on any stop card to get latest data
   - Visual loading indicators show when data is being fetched
   - Pull-to-refresh gesture refreshes all stops simultaneously
   - Tapping on a stop card expands it to show more detail

4. **Navigation & Updates**:
   - Link to Settings page allows quick access to update preferences
   - Auto-update every 30 seconds (aligning with cache strategy)
   - Graceful error handling with retry options if network fails

5. **Edge Cases**:
   - If no arrivals are available for a stop, clearly indicate "No arrivals scheduled"
   - If the API returns an error, show friendly error message with refresh option
   - If home stop is not set, prioritize the prompt to configure it
   - If the user has just edited settings, immediately reflect changes on return
   - There should never be 'N/A' values for stops in the selector modal, it should always have a default value

## Testing Considerations
- Test with various combinations of home stop and 0-3 favorite stops set
- Verify accurate time calculations for "minutes until arrival" in different timezones
- Test network failure scenarios and appropriate error recovery
- Verify real-time updates work correctly with the background refresh logic
- Test the experience with very slow network connections
- Verify transitions between Settings and Home page maintain state correctly
- Test with extremely long station names to ensure proper text truncation

## Design Specifications
- **Layout**:
  - Mobile-first with responsive design for larger screens
  - Card-based UI with subtle shadows and rounded corners
  - Maintain consistent whitespace (16px standard padding)
  - Sticky header with greeting that remains visible during scroll

- **Typography**:
  - Large, clear station names (20px, semi-bold)
  - Easy-to-read arrival times with emphasis on minutes remaining
  - Subtle secondary information (directions, timestamps)

- **Color & Theme**:
  - Use route colors from ROUTE_COLORS constant for train lines
  - Main UI follows black/white minimalist aesthetic
  - Colored accents only for train lines and status indicators

- **Animations**:
  - Subtle refresh animation for loading states
  - Smooth transitions when expanding/collapsing stop details
  - Pulsing effect for approaching trains

- **States**:
  - Normal: Clean display of arrival information
  - Loading: Subtle loading indicators that don't disrupt the display
  - Empty: Friendly prompt to configure settings
  - Error: Non-intrusive error message with retry option