// src/components/shared/RouteIndicator.tsx

import React from 'react';
import { cn } from '@/lib/utils';
import type { RouteColor } from '@/lib/types/cta';
import { ROUTE_COLORS } from '@/lib/types/cta';

interface RouteIndicatorProps {
  route: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Normalize the route code to match our RouteColor type for train circle and background color
 */
export const normalizeRouteColor = (routeCode: string): RouteColor => {
  // Convert route to proper case to match RouteColor type
  const routeMap: Record<string, RouteColor> = {
    'RED': 'Red',
    'BLUE': 'Blue',
    'BRN': 'Brn',
    'G': 'G',
    'ORG': 'Org',
    'P': 'P',
    'PINK': 'Pink',
    'Y': 'Y'
  };
  
  return routeMap[routeCode.toUpperCase()] || 'Red'; // Default to Red if unknown
};

/**
 * Helper function to get background color class with opacity for a route
 */
export const getRouteBackgroundClass = (routeCode: string): string => {
  const normalizedRoute = normalizeRouteColor(routeCode);
  // Return the Tailwind class with opacity
  return `${ROUTE_COLORS[normalizedRoute].replace('bg-', 'bg-opacity-10 bg-')}`;
};

/**
 * RouteIndicator component - displays a colored circle for a train route
 */
export const RouteIndicator: React.FC<RouteIndicatorProps> = ({
  route,
  size = 'md',
  className
}) => {
  const normalizedRoute = normalizeRouteColor(route);
  const routeColorClass = ROUTE_COLORS[normalizedRoute] || 'bg-gray-600';
  
  // Size classes
  const sizeClasses = {
    'sm': 'w-2 h-2',
    'md': 'w-3 h-3',
    'lg': 'w-4 h-4'
  };
  
  return (
    <div
      className={cn(
        'rounded-full',
        routeColorClass,
        sizeClasses[size],
        className
      )}
    />
  );
};

/**
 * Helper function to get the full line name from a route code
 */
export const getFullLineName = (code: string): string => {
  const lineNames: Record<string, string> = {
    'Org': 'Orange',
    'G': 'Green',
    'Brn': 'Brown',
    'Y': 'Yellow',
    'P': 'Purple',
    'Pink': 'Pink',
    'Red': 'Red',
    'Blue': 'Blue'
  };
  return lineNames[code] || code;
};

export default RouteIndicator;