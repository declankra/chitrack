import { NextRequest, NextResponse } from "next/server";
import redis from "@/lib/redis";

/**
 * This route fetches CTA train arrivals for a given 'mapid' (train station),
 * caches it in Redis for 30 seconds, and returns the data as JSON.
 * Falls back to direct CTA API calls if Redis is unavailable.
 *
 * Usage: GET /api/cta?mapid=40380
 */
export async function GET(request: NextRequest) {
  try {
    // Get the stop 'mapid' from the query string
    const { searchParams } = new URL(request.url);
    const mapid = searchParams.get("mapid") || "40380"; // default to 40380 for example

    // Build a redis cache key using the mapid
    const cacheKey = `cta_arrivals_${mapid}`;

    // Try to get cached data
    let cachedData = null;
    try {
      cachedData = await redis.get(cacheKey);
    } catch (redisError) {
      console.warn("Redis error, falling back to direct API call:", redisError);
    }

    if (cachedData) {
      // If cached, parse and return it
      return NextResponse.json(JSON.parse(cachedData));
    }

    // Otherwise, fetch fresh data from the CTA API
    // CTA API endpoint: e.g., https://lapi.transitchicago.com/api/1.0/ttarrivals.aspx
    // This example uses JSON output. Make sure you have a valid CTA API key.
    const ctaApiKey = process.env.CTA_TRAIN_API_KEY;
    if (!ctaApiKey) {
      return NextResponse.json({ error: "CTA API key not configured." }, { status: 500 });
    }

    const ctaUrl = `https://lapi.transitchicago.com/api/1.0/ttarrivals.aspx?key=${ctaApiKey}&mapid=${mapid}&outputType=JSON`;

    // Fetch CTA arrivals
    const ctaResponse = await fetch(ctaUrl);
    if (!ctaResponse.ok) {
      return NextResponse.json({ error: "Failed to fetch CTA data." }, { status: 502 });
    }

    const data = await ctaResponse.json();

    // Try to cache the data, but don't fail if Redis is unavailable
    try {
      await redis.set(cacheKey, JSON.stringify(data), "EX", 30);
    } catch (redisCacheError) {
      console.warn("Failed to cache data in Redis:", redisCacheError);
    }

    // Return fresh data
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error in CTA API route:", error);
    return NextResponse.json(
      { error: "Server error.", details: error.message },
      { status: 500 }
    );
  }
}