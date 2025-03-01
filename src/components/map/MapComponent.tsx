// src/components/map/MapComponent.tsx

'use client';

import React, { useState, useEffect, useRef } from 'react';
import mapboxgl, { LngLatBoundsLike, LngLatLike } from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPin } from 'lucide-react';
import { RouteColor, ROUTE_COLORS } from '@/lib/types/cta';
import type { Station } from '@/lib/types/cta';

// Chicago coordinates and bounds
const CHICAGO_CENTER = [-87.6298, 41.8781];
const CHICAGO_BOUNDS = [
  [-88.0, 41.6], // Southwest coordinates
  [-87.2, 42.1]  // Northeast coordinates
];

// Simplified GeoJSON for major CTA lines
const SIMPLIFIED_CTA_LINES = {
  'Red': {
    type: 'Feature',
    properties: { color: 'Red' },
    geometry: {
      type: 'LineString',
      coordinates: [
        [-87.6298, 42.0188], // Howard
        [-87.6309, 41.9784], // Loyola
        [-87.6594, 41.9474], // Wilson
        [-87.6533, 41.9168], // Belmont
        [-87.6282, 41.8939], // Fullerton
        [-87.6282, 41.8781], // Chicago
        [-87.6277, 41.8564], // Jackson
        [-87.6312, 41.8299], // Sox-35th
        [-87.6307, 41.7994], // Garfield
        [-87.6243, 41.7226], // 95th/Dan Ryan
      ]
    }
  },
  'Blue': {
    type: 'Feature',
    properties: { color: 'Blue' },
    geometry: {
      type: 'LineString',
      coordinates: [
        [-87.9042, 41.9776], // O'Hare
        [-87.8089, 41.9823], // Harlem
        [-87.7432, 41.9609], // Montrose
        [-87.7085, 41.9297], // Logan Square
        [-87.6688, 41.9097], // Western
        [-87.6554, 41.8909], // Chicago
        [-87.6293, 41.8807], // Clark/Lake
        [-87.6294, 41.8781], // Washington
        [-87.6407, 41.8755], // Clinton
        [-87.6774, 41.8757], // Illinois Medical District
        [-87.7176, 41.8741], // Pulaski
        [-87.8173, 41.8743], // Forest Park
      ]
    }
  },
  'Brown': {
    type: 'Feature',
    properties: { color: 'Brn' },
    geometry: {
      type: 'LineString',
      coordinates: [
        [-87.7131, 41.9679], // Kimball
        [-87.7088, 41.9661], // Kedzie
        [-87.6885, 41.9662], // Western
        [-87.6637, 41.9438], // Southport
        [-87.6536, 41.9474], // Belmont
        [-87.6533, 41.9168], // Belmont
        [-87.6339, 41.8949], // Merchandise Mart
        [-87.6309, 41.8855], // Clark/Lake
        [-87.6290, 41.8768], // Washington/Wells
        [-87.6311, 41.8762], // LaSalle/Van Buren
        [-87.6281, 41.8765], // Library
      ]
    }
  },
  'Green': {
    type: 'Feature',
    properties: { color: 'G' },
    geometry: {
      type: 'LineString',
      coordinates: [
        [-87.8032, 41.8867], // Harlem/Lake
        [-87.7767, 41.8874], // Oak Park
        [-87.7447, 41.8865], // Ridgeland
        [-87.7254, 41.8854], // Pulaski
        [-87.6962, 41.8842], // California
        [-87.6670, 41.8854], // Ashland
        [-87.6419, 41.8857], // Clinton
        [-87.6309, 41.8855], // Clark/Lake
        [-87.6278, 41.8768], // State/Lake
        [-87.6278, 41.8755], // Adams/Wabash
        [-87.6277, 41.8564], // Roosevelt
        [-87.6185, 41.8316], // 35th-Bronzeville-IIT
        [-87.6184, 41.8099], // 47th
        [-87.6183, 41.7952], // Garfield
        [-87.6183, 41.7802], // King Drive
        [-87.6059, 41.7803], // Cottage Grove
        [-87.6638, 41.7790], // Ashland/63rd
      ]
    }
  },
  'Orange': {
    type: 'Feature',
    properties: { color: 'Org' },
    geometry: {
      type: 'LineString',
      coordinates: [
        [-87.6278, 41.8768], // State/Lake
        [-87.6277, 41.8564], // Roosevelt
        [-87.6337, 41.8356], // 35th/Archer
        [-87.6653, 41.8393], // Ashland
        [-87.6840, 41.8046], // Western
        [-87.7045, 41.8042], // Kedzie
        [-87.7245, 41.7998], // Pulaski
        [-87.7379, 41.7866], // Midway
      ]
    }
  },
  'Pink': {
    type: 'Feature',
    properties: { color: 'Pink' },
    geometry: {
      type: 'LineString',
      coordinates: [
        [-87.7567, 41.8518], // 54th/Cermak
        [-87.7453, 41.8518], // Cicero
        [-87.7333, 41.8538], // Kostner
        [-87.7258, 41.8539], // Pulaski
        [-87.7054, 41.8540], // Kedzie
        [-87.6851, 41.8542], // California
        [-87.6760, 41.8545], // Western
        [-87.6670, 41.8545], // Damen
        [-87.6670, 41.8854], // Ashland
        [-87.6419, 41.8857], // Clinton
        [-87.6309, 41.8855], // Clark/Lake
      ]
    }
  },
  'Purple': {
    type: 'Feature',
    properties: { color: 'P' },
    geometry: {
      type: 'LineString',
      coordinates: [
        [-87.6907, 42.0735], // Linden
        [-87.6835, 42.0582], // Noyes
        [-87.6853, 42.0447], // Main
        [-87.6812, 42.0190], // Howard
        [-87.6594, 41.9474], // Wilson
        [-87.6533, 41.9168], // Belmont
        [-87.6339, 41.8949], // Merchandise Mart
        [-87.6309, 41.8855], // Clark/Lake
      ]
    }
  },
  'Yellow': {
    type: 'Feature',
    properties: { color: 'Y' },
    geometry: {
      type: 'LineString',
      coordinates: [
        [-87.6835, 42.0582], // Noyes
        [-87.7519, 42.0409], // Dempster-Skokie
        [-87.7472, 42.0262], // Oakton-Skokie
      ]
    }
  }
};

// Helper function to convert route code to hex color
const getRouteColor = (routeCode: RouteColor): string => {
  switch (routeCode) {
    case 'Red': return '#dc2626'; // red-600
    case 'Blue': return '#2563eb'; // blue-600
    case 'Brn': return '#92400e'; // amber-800
    case 'G': return '#16a34a'; // green-600
    case 'Org': return '#f97316'; // orange-500
    case 'P': return '#9333ea'; // purple-600
    case 'Pink': return '#ec4899'; // pink-500
    case 'Y': return '#eab308'; // yellow-500
    default: return '#000000';
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
  
  // Fetch Mapbox token from secure API endpoint
  useEffect(() => {
    const fetchMapboxToken = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/mapbox');
        
        if (!response.ok) {
          throw new Error('Failed to fetch Mapbox token');
        }
        
        const data = await response.json();
        setMapboxToken(data.token);
        
        // Set the token for mapboxgl
        mapboxgl.accessToken = data.token;
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching Mapbox token:', err);
        setError('Failed to load map. Please try again later.');
        setIsLoading(false);
      }
    };
    
    fetchMapboxToken();
  }, []);
  
  // Initialize map when component mounts and token is available
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken || isLoading) return;
    
    // Create map instance
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v10', // Light monochromatic style
      center: CHICAGO_CENTER as LngLatLike,
      zoom: 11,
      maxBounds: CHICAGO_BOUNDS as LngLatBoundsLike, // Restrict map panning to Chicago area
      attributionControl: false,
    });
    
    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'bottom-right');
    
    // Set up map events
    const mapInstance = map.current;
    mapInstance.on('load', () => {
      // Add transit lines to the map
      Object.entries(SIMPLIFIED_CTA_LINES).forEach(([routeName, line]) => {
        const routeCode = line.properties.color as RouteColor;
        const color = getRouteColor(routeCode);
        
        mapInstance.addSource(`line-${routeName}`, {
          type: 'geojson',
          data: line as unknown as GeoJSON.Feature
        });
        
        mapInstance.addLayer({
          id: `line-${routeName}`,
          type: 'line',
          source: `line-${routeName}`,
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': color,
            'line-width': 4
          }
        });
      });
      
      // Add station markers after transit lines are added
      addStationMarkers();
    });
    
    // Add global styles for map components
    addMapStyles();
    
    // Clean up on unmount
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
      removeMapStyles();
    };
  }, [mapboxToken, isLoading]);
  
  // Update station markers when stations data changes
  useEffect(() => {
    if (map.current && map.current.loaded() && stations.length > 0) {
      addStationMarkers();
    }
  }, [stations]);
  
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
        
        /* Pulsing dot animation for user location */
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(0, 122, 255, 0.5); }
          70% { box-shadow: 0 0 0 10px rgba(0, 122, 255, 0); }
          100% { box-shadow: 0 0 0 0 rgba(0, 122, 255, 0); }
        }
        
        .pulsing-dot {
          animation: pulse 2s infinite;
        }
        
        /* Station marker hover effects */
        .station-marker:hover {
          transform: scale(1.5);
          box-shadow: 0 0 0 4px rgba(0, 0, 0, 0.1);
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
    if (!map.current || stations.length === 0) return;
    
    // Remove existing markers first (if any)
    const markers = document.getElementsByClassName('station-marker');
    while (markers[0]) {
      markers[0].remove();
    }
    
    // Add markers for each station
    stations.forEach(station => {
      if (!station.lat || !station.lon) return;
      
      // Create marker element
      const markerEl = document.createElement('div');
      markerEl.className = 'station-marker';
      markerEl.style.width = '12px';
      markerEl.style.height = '12px';
      markerEl.style.borderRadius = '50%';
      markerEl.style.backgroundColor = '#000';
      markerEl.style.border = '2px solid white';
      markerEl.style.boxShadow = '0 0 0 1px rgba(0, 0, 0, 0.1)';
      markerEl.style.cursor = 'pointer';
      markerEl.style.transition = 'transform 0.2s ease, box-shadow 0.2s ease';
      
      // Create and add marker
      const marker = new mapboxgl.Marker(markerEl)
        .setLngLat([station.lon, station.lat])
        .addTo(map.current!);
      
      // Add click handler
      markerEl.addEventListener('click', () => {
        // Visual feedback on click
        markerEl.style.transform = 'scale(1.5)';
        setTimeout(() => {
          markerEl.style.transform = 'scale(1)';
        }, 300);
        
        onStationSelect(station);
      });
    });
  };
  
  // Handle the "Locate Me" button click
  const handleLocateMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation(position);
          
          if (map.current) {
            map.current.flyTo({
              center: [position.coords.longitude, position.coords.latitude],
              zoom: 15,
              essential: true
            });
            
            // Add or update user location marker
            addUserLocationMarker(position);
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
  
  // Add user location marker to the map
  const addUserLocationMarker = (position: GeolocationPosition) => {
    if (!map.current) return;
    
    // Remove existing user marker if any
    const userMarker = document.getElementById('user-location-marker');
    if (userMarker) userMarker.remove();
    
    // Create user location marker
    const userMarkerEl = document.createElement('div');
    userMarkerEl.id = 'user-location-marker';
    userMarkerEl.className = 'pulsing-dot';
    userMarkerEl.style.width = '16px';
    userMarkerEl.style.height = '16px';
    userMarkerEl.style.borderRadius = '50%';
    userMarkerEl.style.backgroundColor = 'rgba(0, 122, 255, 0.5)';
    userMarkerEl.style.border = '3px solid rgba(0, 122, 255, 1)';
    
    // Add marker to map
    new mapboxgl.Marker(userMarkerEl)
      .setLngLat([position.coords.longitude, position.coords.latitude])
      .addTo(map.current);
  };
  
  return (
    <div className="relative h-full w-full">
      {isLoading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
            <p>Loading map...</p>
          </div>
        </div>
      ) : error ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center p-4 bg-destructive/10 rounded-md">
            <p className="text-destructive font-medium">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm"
            >
              Retry
            </button>
          </div>
        </div>
      ) : (
        <>
          <div ref={mapContainer} className="absolute inset-0" />
          
          {/* Locate Me button */}
          <button
            onClick={handleLocateMe}
            className="absolute top-4 right-4 z-10 bg-background/80 rounded-full p-2 shadow-md backdrop-blur-sm"
            aria-label="Locate me"
          >
            <MapPin className="h-5 w-5" />
          </button>
        </>
      )}
    </div>
  );
};

export default MapComponent;