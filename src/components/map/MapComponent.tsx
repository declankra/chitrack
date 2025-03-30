// src/components/map/MapComponent.tsx

'use client';

import React, { useState, useEffect, useRef } from 'react';
import mapboxgl, { LngLatBoundsLike, LngLatLike } from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css'; // Make sure this import is at the top
import { MapPin } from 'lucide-react';
import { RouteColor, ROUTE_COLORS } from '@/lib/types/cta';
import type { Station } from '@/lib/types/cta';
import type { FeatureCollection, Feature, GeoJsonProperties, LineString } from 'geojson'; // Import GeoJSON types

// Chicago coordinates and bounds
const CHICAGO_CENTER = [-87.6298, 41.8781];
const CHICAGO_BOUNDS = [
  [-88.0, 41.6], // Southwest coordinates
  [-87.2, 42.1]  // Northeast coordinates
];

// Helper function to convert route code to hex color
const getRouteColor = (routeCode: string | undefined): string => { // Allow undefined input
  // Normalize potential inputs from GeoJSON properties
  const normalizedCode = routeCode?.toUpperCase();
  switch (normalizedCode) {
    case 'RED': return '#dc2626'; // red-600
    case 'BLUE': return '#2563eb'; // blue-600
    case 'BRN': // Brown line
    case 'BROWN':
      return '#92400e'; // amber-800
    case 'G': // Green line
    case 'GREEN':
      return '#16a34a'; // green-600
    case 'ORG': // Orange line
    case 'ORANGE':
      return '#f97316'; // orange-500
    case 'P': // Purple line
    case 'PURPLE':
      return '#9333ea'; // purple-600
    case 'PINK': return '#ec4899'; // pink-500
    case 'Y': // Yellow line
    case 'YELLOW':
      return '#eab308'; // yellow-500
    default:
      console.warn(`Unknown route code: ${routeCode}, using black.`);
      return '#000000'; // Default black
  }
};

interface MapComponentProps {
  stations: Station[];
  onStationSelect: (station: Station) => void;
}

const MapComponent: React.FC<MapComponentProps> = ({ stations, onStationSelect }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [userLocation, setUserLocation] = useState<GeolocationPosition | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isMapReady, setIsMapReady] = useState<boolean>(false); // Track map load and data fetch

  // Fetch Mapbox token from secure API endpoint
  useEffect(() => {
    const fetchMapboxToken = async () => {
      try {
        setIsLoading(true); // Ensure loading starts/continues
        setError(null); // Clear previous errors
        console.log('Fetching Mapbox token...');
        const response = await fetch('/api/mapbox');

        if (!response.ok) {
          throw new Error(`Failed to fetch Mapbox token: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Mapbox token received:', data.token ? 'Token exists' : 'Token is empty');

        if (!data.token) {
          throw new Error('Received empty Mapbox token from API');
        }

        setMapboxToken(data.token);
        mapboxgl.accessToken = data.token;
        // DO NOT set isLoading false here; wait for map load event.
      } catch (err) {
        console.error('Error fetching Mapbox token:', err);
        setError(`Failed to load map credentials: ${err instanceof Error ? err.message : 'Unknown error'}`);
        setIsLoading(false); // Stop loading ONLY on token fetch error
      }
    };

    fetchMapboxToken();
  }, []); // Runs only on mount

  // Initialize map when token is available and container is ready
  useEffect(() => {
    // Conditions: Token exists, container ref exists, map not yet initialized
    if (!mapboxToken || !mapContainer.current || map.current) {
      console.log('Map initialization prerequisites not met:', {
        tokenExists: !!mapboxToken,
        containerExists: !!mapContainer.current,
        mapInitialized: !!map.current
      });
      return; // Prerequisites not met, wait for them (e.g., next render after ref attached)
    }

    try {
      console.log('Initializing Mapbox map...');
      const container = mapContainer.current; // Use the ref now that we know it exists

      // Verify container dimensions (optional but good practice)
      const containerStyle = window.getComputedStyle(container);
      console.log('Map container dimensions on init:', {
        width: containerStyle.width,
        height: containerStyle.height,
      });
       if (containerStyle.width === '0px' || containerStyle.height === '0px') {
         console.warn("Map container has zero dimensions during init. Map might not render correctly.");
       }

      // Create map instance
      const mapInstance = new mapboxgl.Map({
        container: container, // Use the verified container
        style: 'mapbox://styles/mapbox/light-v10', // Light monochromatic style
        center: CHICAGO_CENTER as LngLatLike,
        zoom: 11,
        maxBounds: CHICAGO_BOUNDS as LngLatBoundsLike, // Restrict map panning to Chicago area
        attributionControl: false,
        logoPosition: 'top-right', // Position the logo in top-right corner
      });

      map.current = mapInstance; // Store the map instance

      console.log('Map instance created:', !!map.current);

      // Add navigation controls
      mapInstance.addControl(new mapboxgl.NavigationControl(), 'bottom-right');

      // Set up map events
      mapInstance.on('load', async () => {
        console.log('Map loaded event triggered.');
        try {
          console.log('Fetching detailed CTA lines GeoJSON...');
          const response = await fetch('/cta_lines_detailed.geojson');
          if (!response.ok) {
            throw new Error(`Failed to fetch GeoJSON: ${response.status} ${response.statusText}`);
          }
          const ctaLinesData = await response.json() as FeatureCollection<LineString, GeoJsonProperties>;
          console.log('Detailed CTA lines GeoJSON fetched successfully.');

          // --- Add Detailed Transit Lines --- NEW APPROACH ---
          const ALL_LINES_SOURCE_ID = 'detailed-cta-lines';

          // Define canonical line names/identifiers used in the GeoJSON properties
          // (Adjust these based on EXACT values needed for filtering, e.g., 'Red', 'Blue', 'G', 'Brn', etc.)
          const CANONICAL_LINE_NAMES = ['Red', 'Blue', 'Green', 'Brown', 'Purple', 'Yellow', 'Pink', 'Orange'];

          // Remove potentially pre-existing source and layers from previous approach or HMR
          const existingSource = mapInstance.getSource(ALL_LINES_SOURCE_ID);
          if (existingSource) {
            // Remove layers using the source first
            const currentStyle = mapInstance.getStyle(); // Get style once
            if (currentStyle && currentStyle.layers) {
              currentStyle.layers.forEach(layer => {
                if (layer.source === ALL_LINES_SOURCE_ID) {
                  mapInstance.removeLayer(layer.id);
                }
              });
            }
            mapInstance.removeSource(ALL_LINES_SOURCE_ID);
            console.log(`Removed existing source: ${ALL_LINES_SOURCE_ID}`);
          }

          // 1. Add a SINGLE source for all line features
          mapInstance.addSource(ALL_LINES_SOURCE_ID, {
            type: 'geojson',
            data: ctaLinesData // The full FeatureCollection
          });
          console.log(`Added single source: ${ALL_LINES_SOURCE_ID}`);

          // 2. Add a separate LAYER for each canonical line color, filtered
          CANONICAL_LINE_NAMES.forEach((lineName, index) => {
            const layerId = `layer-line-${lineName}`;
            const color = getRouteColor(lineName); // Get color based on canonical name

            // Filter features where the 'LINES' property string CONTAINS the canonical name
            // Note: This is case-sensitive. Adjust filter or data if needed.
            const filter = ['in', lineName, ['string', ['get', 'LINES']]];

            mapInstance.addLayer({
              id: layerId,
              type: 'line',
              source: ALL_LINES_SOURCE_ID,
              layout: {
                'line-join': 'round',
                'line-cap': 'round'
              },
              paint: {
                'line-color': color,
                // Use a slightly thinner line width, maybe offset based on index for shared tracks
                'line-width': 3.5,
                // Example offset: shift lines slightly side-by-side on shared tracks
                // Adjust multiplier as needed for visual separation
                'line-offset': (index - CANONICAL_LINE_NAMES.length / 2 + 0.5) * 1.5
              },
              filter: filter // Apply the filter here
            });
            console.log(`Added layer ${layerId} for ${lineName} with color ${color}`);
          });
          // ---------------------------------------------------

          // Add station markers AFTER transit lines are added
          console.log('GeoJSON processed, setting map ready and stopping loading.');
          setIsMapReady(true); // Mark map as visually ready
          setIsLoading(false); // <--- Set loading false HERE

        } catch (fetchErr) {
          console.error('Error fetching or processing detailed CTA lines:', fetchErr);
          setError(`Failed to load transit lines: ${fetchErr instanceof Error ? fetchErr.message : 'Unknown error'}`);
          setIsLoading(false); // Stop loading on GeoJSON fetch error
        }
      });

      // Listen for map errors
      mapInstance.on('error', (e) => {
        console.error('Mapbox error:', e);
        if (!error) { // Avoid overwriting more specific errors
            setError(`Map error: ${e.error?.message || 'Unknown error'}`);
        }
        setIsLoading(false); // Stop loading on map error
      });

      // Add global styles for map components
      addMapStyles(); // Function defined elsewhere

    } catch (initErr) {
      console.error('Error initializing map:', initErr);
      setError(`Failed to initialize map: ${initErr instanceof Error ? initErr.message : 'Unknown error'}`);
      setIsLoading(false); // Stop loading on initialization error
    }

    // Clean up on unmount
    return () => {
      if (map.current) {
        console.log('Cleaning up map instance');
        map.current.remove();
        map.current = null;
      }
      removeMapStyles(); // Function defined elsewhere
      setIsMapReady(false); // Reset map ready state
    };
  // Dependencies: Re-run if the token changes. The check for mapContainer happens inside.
  }, [mapboxToken]);


  // Update station markers when stations data changes OR when map becomes ready
  useEffect(() => {
    // Ensure map is initialized, ready, and stations are available
    if (map.current && isMapReady && stations.length > 0) {
      console.log("Map is ready and stations available, adding/updating markers.");
      addStationMarkers();
    } else {
       console.log("Conditions not met for adding station markers:", {
           mapExists: !!map.current,
           isMapReady: isMapReady,
           stationsExist: stations.length > 0
       });
    }
  // Depend on stations data AND the map ready state
  }, [stations, isMapReady]);

  // Add global styles for map components
  const addMapStyles = () => {
    if (!document.getElementById('map-styles')) {
      const style = document.createElement('style');
      style.id = 'map-styles';
      style.innerHTML = `
        .mapboxgl-ctrl-bottom-right {
          /* Move controls up to account for bottom dock */
          bottom: 70px !important;
        }
        
        /* Hide Mapbox logo */
        .mapboxgl-ctrl-logo {
          display: none !important;
        }
        
        /* Pulsing dot animation for user location */
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(0, 122, 255, 0.5); }
          70% { box-shadow: 0 0 0 10px rgba(0, 122, 255, 0); }
          100% { box-shadow: 0 0 0 0 rgba(0, 122, 255, 0); }
        }
        
        .pulsing-dot {
          animation: pulse 2s infinite;
        }
        
        /* Station marker hover effects - Target the inner element */
        .station-marker:hover > div {
          transform: scale(1.5);
          box-shadow: 0 0 0 4px rgba(0, 0, 0, 0.1);
        }

        /* Remove station marker click effect class */
        /* .station-marker-clicked { ... } */

        /* Make sure the map canvas is visible */
        .mapboxgl-canvas {
          display: block !important;
        }
        
        /* Fix potential z-index issues */
        .mapboxgl-map {
          z-index: 1;
        }
      `;
      document.head.appendChild(style);
    }
  };
  
  // Remove global styles
  const removeMapStyles = () => {
    const styleEl = document.getElementById('map-styles');
    if (styleEl) {
      styleEl.remove();
    }
  };
  
  // Add station markers to the map
  const addStationMarkers = () => {
    if (!map.current || !isMapReady) { // Check isMapReady here too
        console.log("Skipping marker add: Map not ready or stations empty");
        return;
    };

    // Remove existing markers first (if any) - Improved efficiency
    const existingMarkers = map.current.getContainer().querySelectorAll('.station-marker');
    existingMarkers.forEach(marker => marker.remove());


    // Add markers for each station
    stations.forEach(station => {
      if (!station.lat || !station.lon) {
          console.warn(`Station ${station.stationName} missing coordinates.`);
          return;
      };

      // Create marker element (outer container)
      const markerEl = document.createElement('div');
      markerEl.className = 'station-marker';
      markerEl.style.cursor = 'pointer';
      markerEl.title = station.stationName; // Add tooltip

      // Create inner element for visual representation and transforms
      const innerEl = document.createElement('div');
      innerEl.style.width = '12px';
      innerEl.style.height = '12px';
      innerEl.style.borderRadius = '50%';
      innerEl.style.backgroundColor = '#000';
      innerEl.style.border = '2px solid white';
      innerEl.style.boxShadow = '0 0 0 1px rgba(0, 0, 0, 0.1)';
      innerEl.style.transition = 'transform 0.2s ease, box-shadow 0.2s ease';
      innerEl.style.transformOrigin = 'center center'; // Ensure scaling is centered

      // Append inner element to marker element
      markerEl.appendChild(innerEl);

      // Create and add marker using the outer element
      const marker = new mapboxgl.Marker({ element: markerEl, anchor: 'center' })
        .setLngLat([station.lon, station.lat])
        .addTo(map.current!);

      // Add click handler to the outer element
      markerEl.addEventListener('click', (e) => {
         e.stopPropagation(); // Prevent map click event when clicking marker
        // Visual feedback on click - Apply transform to inner element
        innerEl.style.transform = 'scale(1.5)';
        setTimeout(() => {
          // Reset transform on inner element
          innerEl.style.transform = 'scale(1)';
        }, 300);

        onStationSelect(station);
      });
    });
     console.log(`Added/Updated ${stations.length} station markers.`);
  };
  
  // Handle the "Locate Me" button click
  const handleLocateMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation(position);

          if (map.current && isMapReady) { // Check if map is ready
            map.current.flyTo({
              center: [position.coords.longitude, position.coords.latitude],
              zoom: 15,
              essential: true
            });

            // Add or update user location marker
            addUserLocationMarker(position);
          } else {
              console.log("Map not ready to fly to location.");
          }
        },
        (error) => {
          console.error('Error getting location:', error);
          // Show error message to user
          alert('Unable to access your location. Please check your browser permissions.');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };
  
  // Add user location marker to the map (Using Marker for simpler pulsing)
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null); // Keep ref to marker

  const addUserLocationMarker = (position: GeolocationPosition) => {
      if (!map.current || !isMapReady) return;

      const coords: LngLatLike = [position.coords.longitude, position.coords.latitude];

      // If marker exists, just update its position
      if (userMarkerRef.current) {
          userMarkerRef.current.setLngLat(coords);
          console.log("Updated user location marker position.");
      } else {
          // Create user location marker element with pulsing animation class
          const userMarkerEl = document.createElement('div');
          userMarkerEl.className = 'pulsing-dot'; // Apply CSS class for animation/styling

          // Add marker to map and store reference
          userMarkerRef.current = new mapboxgl.Marker(userMarkerEl)
              .setLngLat(coords)
              .addTo(map.current);
          console.log("Added new user location marker.");
      }
  };
  
  return (
    <div className="relative h-full w-full">
      {/* Loading Overlay - Shown only when isLoading is true */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-50">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
            <p>Loading map...</p>
          </div>
        </div>
      )}

      {/* Error Overlay - Shown only on error AND not loading */}
      {error && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-40">
          <div className="text-center p-4 bg-destructive/10 border border-destructive/30 rounded-md shadow-lg">
            <p className="text-destructive font-medium mb-2">Map Error</p>
            <p className="text-sm text-destructive/80 mb-3">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-1.5 bg-destructive text-destructive-foreground rounded-md text-sm hover:bg-destructive/90"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Map Container Div - Always rendered for ref attachment, visibility controlled by style */}
       <div
          ref={mapContainer}
          className="absolute inset-0 bg-gray-200" // Basic background shown before map tiles load
          style={{
             width: '100%',
             height: '100%',
             // Hide map visually until ready to prevent flash of unstyled/incomplete map
             visibility: isMapReady ? 'visible' : 'hidden'
           }}
       />

       {/* UI elements overlaying the map - Shown when map is ready */}
       {isMapReady && !error && (
         <button
           onClick={handleLocateMe}
           className="absolute top-4 right-4 z-10 bg-background/80 rounded-full p-2 shadow-md backdrop-blur-sm hover:bg-background/90 transition-colors"
           aria-label="Locate me"
           title="Locate me" // Tooltip for accessibility
         >
           <MapPin className="h-5 w-5" />
         </button>
       )}
    </div>
  );
};

export default MapComponent;