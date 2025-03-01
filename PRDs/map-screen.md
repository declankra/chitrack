# Map Screen

## Overview
The Map Screen provides users with a geospatial view of Chicago's transit system, allowing quick access to real-time train arrivals by tapping on station markers.

## Problem Statement
Transit users navigating unfamiliar areas or exploring route options outside of their routine need a visual way to locate nearby stations and check arrival times. Current transit maps are often cluttered, slow to load, and require multiple steps to access time-sensitive arrival information, creating friction at a critical moment in the user journey.

## Goals

**Business Goal:** Increase user engagement by providing an intuitive, location-aware interface that showcases the app's premium design aesthetic, encouraging word-of-mouth referrals and eventual conversion to the paid iOS app.  
**User Goal:** Rapidly locate and access train arrival times from unfamiliar stations based on geographic proximity, without needing to know station names or line designations in advance.  
**Non-Goals:**
- We are not creating a comprehensive trip planning tool with directions or routing
- We are not displaying bus routes or bus stops in this version
- We are not showing real-time train positions/movements on the map


## User Stories

- As a visitor to Chicago, I want to view a clean map of transit lines so that I can understand the train system layout at a glance.
- As a daily commuter exploring alternate routes, I want to quickly tap any station marker to view upcoming arrival times without leaving the map context so that I can consider alternate routes.
- As a user in an unfamiliar neighborhood, I can center the map on my current location so that I can find the nearest stations and their real-time arrivals.
- As a user with accessibility needs, I can navigate the map using standard touch gestures and receive clear visual feedback when interacting with station markers.
- As a daily transit user, I want to access a distraction-free, focused map that prioritizes only the information needed for transit decisions so that I can know view arrival times at my normal station fast.

## Requirements

- Display a monochromatic (black and white) base map of Chicago with transit lines rendered according to their official CTA colors
- Restrict map panning to the Chicago metropolitan area only
- Maintain a fixed north-up orientation that doesn't rotate
- Place interactive station markers at each CTA train station location
- Implement station markers that respond to taps with visual feedback
- Display a bottom sheet with real-time arrivals when a station marker is tapped
- Include a "locate me" button in the top-right corner that centers the map on the user's location
- Display a pulsing blue dot to represent the user's current location when location services are enabled
- Ensure smooth zooming and panning with hardware acceleration
- Support standard touch gestures (pinch to zoom, drag to pan)
- Implement map constraints that prevent scrolling beyond the Chicago area
- Display a loading indicator while map assets and station data are being fetched
- Handle offline/error states gracefully with appropriate messaging
- Ensure the bottom sheet displays arrivals in the same format as the ArrivalsBoard.tsx on the Search page for consistency

## Technical Implementation Notes

**Mapping Library:** Use Mapbox GL JS for web and Mapbox SDK for iOS  
**Map Style:** Create a custom style in Mapbox Studio with grayscale base and colored transit lines  
**Data Sources:**
- Station locations: Use the station data from /src/lib/hooks/useStations.ts which contains lat/long coordinates
- Arrivals data: Fetch from /api/cta/arrivals/station?stations={stationId} when a station is selected

**Station Markers:** Use parent_station as the identifier for station markers to connect with arrival data  
**Geolocation:** Implement browser's Geolocation API with appropriate permission handling

**Bottom Sheet Implementation:**
- Reuse ArrivalBoard.tsx components from the Search page for arrival times display
- Create a responsive bottom sheet component that can be summoned/dismissed with swift animations

**Performance Considerations:**
- Load map and station data asynchronously
- Pre-fetch station metadata from local/server stoage at app startup using existing caching strategy
- Implement lazy loading of map tiles
- Use memoization for station markers to prevent re-renders

**Map Container:**
- Use a full-height container that respects the NavigationDock at the bottom
- Ensure proper cleanup of map and geolocation resources on component unmount

## User Experience & Flow

### Initial Load
- User navigates to the Map page via the dock
- (hopefully this isn't needed) Loading indicator appears while map resources initialize
- Base map loads with transit lines and station markers
- Initial view shows the entire CTA system at an appropriate zoom level

### Map Interaction
- User can pan by dragging (limited to Chicago area)
- User can zoom in/out using pinch gestures or buttons
- Map maintains north-up orientation at all times
- Panning beyond Chicago boundaries is prevented with a subtle bounce-back effect

### Geolocation
- User taps the "locate me" button in the top-right
- If first time, browser permission dialog appears
- Upon approval, map smoothly animates to user's location (ensure that at least one station is still visible)
- Blue pulsing dot appears at user's location
- Nearby stations become clearly visible at this zoom level

### Station Selection
- User taps on a station marker
- Marker provides visual feedback (subtle highlight/pulse)
- Bottom sheet smoothly slides up from the bottom of the screen
- Sheet displays station name, applicable stop information and real-time arrivals like ArrivalsBoard.tsx

### Arrival Information
- Bottom sheet shows the same arrival card format as the Search page
- Arrivals automatically refresh while sheet is open
- User can tap a refresh button to manually update arrivals
- User can dismiss sheet by swiping down or clicking anywhere off the sheet (using the map)

### Edge Cases
- If location services are denied, show a non-intrusive message
- If no arrivals are available for a station, display appropriate message
- If network is unavailable, show cached data with timestamp if available
- If map fails to load, show fallback error UI with retry option
- If user is outside serviceable map area, show a informational message

## Testing Considerations

- Test on various screen sizes to ensure responsive map container
- Verify correct geolocation behavior with both allowed and denied permissions
- Test network failure scenarios and recovery
- Validate map constraint behavior at Chicago area boundaries
- Verify tap accuracy on station markers at different zoom levels
- Test bottom sheet behavior on different devices and screen sizes
- Ensure station marker tap works correctly even when zoomed out
- Verify arrival data refreshes correctly when bottom sheet is open
- Test accessibility with VoiceOver/screen readers for important map elements
- Verify appropriate handling of battery optimization modes that may affect geolocation

## Design Specifications

### Map Style
- Base map: Grayscale (black/white/gray) with minimal detail
- Transit lines: Official CTA colors from ROUTE_COLORS constant
- Station markers: Circular dots with subtle glow effect
- Selected station: Enhanced highlight effect when tapped
- User location: Pulsing blue dot with translucent accuracy circle

### Bottom Sheet
- Consistent with app's minimalist aesthetic
- Partial height on initial open with pull handle
- Can be expanded to full height with drag gesture
- Slides in/out with subtle spring animation (300ms duration)
- Background: white/dark based on system appearance
- Border-radius on top corners: 12px
- Drop shadow for elevation: 0 -2px 10px rgba(0,0,0,0.1)

### Controls
- Locate button: Circular, top-right, 44px tap target
- Subtle background blur behind controls for legibility
- Standard zoom controls: +/- buttons on right edge (optional)

### Responsive Behavior
- Full-screen minus navigation dock and status bar
- Bottom sheet adapts to available vertical space
- Controls reposition based on screen size
- Station markers scale appropriately with zoom level