import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

/**
 * GET handler for Mapbox configuration
 * This endpoint provides the Mapbox token securely from the server
 * without exposing it in client-side code
 */
export async function GET() {
  // Basic security: Check referer to prevent unauthorized access
  const headersList = headers();
  const referer = headersList.get('referer') || '';
  const host = headersList.get('host') || '';
  
  // Only allow requests from our own domain
  const isValidReferer = referer.includes(host) || 
                         process.env.NODE_ENV === 'development';
  
  if (!isValidReferer) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 403 }
    );
  }
  
  // Get the Mapbox token from environment variables
  const mapboxToken = process.env.MAPBOX_TOKEN;
  
  // If token is missing, return an error
  if (!mapboxToken) {
    return NextResponse.json(
      { error: 'Mapbox token not configured' },
      { status: 500 }
    );
  }
  
  // Return the token in a JSON response with cache control headers
  // This will only be accessible via API call, not directly in the client bundle
  return NextResponse.json(
    { token: mapboxToken },
    { 
      headers: {
        'Cache-Control': 'private, max-age=3600', // Cache for 1 hour
      }
    }
  );
} 