import { NextRequest, NextResponse } from "next/server"
import redis from "@/lib/redis"

// CTA TRAIN API KEY from your environment
const CTA_API_KEY = process.env.CTA_TRAIN_API_KEY

/**
 * The CTA Arrivals API returns an array of "eta" objects (Arrival).
 */
interface Arrival {
  staId: string   // Parent station ID (4xxxx)
  stpId: string   // Stop (platform) ID (3xxxx)
  staNm: string   // Station name
  stpDe: string   // Platform description (e.g. "Service toward Loop")
  rn: string      // Train run number
  rt: string      // Route (Red, Blue, Brn, etc.)
  destNm: string  // Destination name
  arrT: string    // Predicted arrival time
  prdt: string    // Timestamp when prediction was generated
  isApp: string   // "1" if approaching
  isDly: string   // "1" if delayed
  isSch: string   // "1" if schedule-based (no live data)
}

/**
 * Helper to parse "YYYYMMDD HH:mm:ss" and return a numerical timestamp.
 * If parsing fails, returns Infinity so sorting still works.
 */
function parseArrivalTime(ctaTime: string): number {
  // Example format: "20230609 12:34:56"
  const [datePart, timePart] = ctaTime.split(" ")
  if (!datePart || !timePart) return Infinity
  const year = +datePart.slice(0, 4)
  const month = +datePart.slice(4, 6) - 1 // zero-based
  const day = +datePart.slice(6, 8)

  const [hour, minute, second] = timePart.split(":").map((x) => +x)
  const parsedDate = new Date(year, month, day, hour, minute, second)
  if (Number.isNaN(parsedDate.getTime())) return Infinity
  return parsedDate.getTime()
}

/**
 * GET /api/cta/arrivals/stop?stopId=30070
 * - Returns up to 3 arrivals for a specific platform "stopId" (3xxxx)
 * - short-term caching (30s) via Redis
 */
export async function GET(request: NextRequest) {
  try {
    if (!CTA_API_KEY) {
      return NextResponse.json(
        { error: "CTA_TRAIN_API_KEY not set in environment." },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(request.url)
    const stopId = searchParams.get("stopId")
    if (!stopId) {
      return NextResponse.json(
        { error: "Please provide a 'stopId' query param (3xxxx)." },
        { status: 400 }
      )
    }

    const cacheKey = `arrivals_stop_${stopId}`

    // Check Redis cache
    try {
      const cachedData = await redis.get(cacheKey)
      if (cachedData) {
        return NextResponse.json(JSON.parse(cachedData))
      }
    } catch (err) {
      console.warn("Redis error, proceeding without cache:", err)
    }

    // Build CTA Arrivals request
    const baseUrl = "https://lapi.transitchicago.com/api/1.0/ttarrivals.aspx"
    const urlParams = new URLSearchParams({
      key: CTA_API_KEY,
      outputType: "JSON",
      stpid: stopId,
      max: "10", // fetch up to 10 so we can filter down to 3 if we want
    })
    const ctaUrl = `${baseUrl}?${urlParams.toString()}`

    const ctaResponse = await fetch(ctaUrl)
    if (!ctaResponse.ok) {
      return NextResponse.json(
        {
          error: "Failed to fetch data from CTA Arrivals API",
          details: await ctaResponse.text(),
        },
        { status: 502 }
      )
    }

    const data = await ctaResponse.json()
    if (!data?.ctatt?.eta) {
      return NextResponse.json(
        {
          error: "CTA API did not return arrivals (eta). Possibly an error.",
          details: data,
        },
        { status: 500 }
      )
    }

    const rawArrivals: Arrival[] = data.ctatt.eta
    if (rawArrivals.length === 0) {
      // no arrivals returned
      const result = {
        stopId,
        arrivals: [],
      }
      // store in cache
      try {
        await redis.set(cacheKey, JSON.stringify(result), "EX", 30)
      } catch (cacheErr) {
        console.warn("Redis caching failed:", cacheErr)
      }
      return NextResponse.json(result)
    }

    // We assume all arrivals share the same stpId/stpDe if the CTA returned multiple
    const stpId = rawArrivals[0].stpId
    const stpDe = rawArrivals[0].stpDe
    const route = rawArrivals[0].rt

    // sort them by arrival time ascending
    rawArrivals.sort((a, b) => parseArrivalTime(a.arrT) - parseArrivalTime(b.arrT))

    // take up to 3
    const arrivals = rawArrivals.slice(0, 3)

    // final response object
    const result = {
      stopId: stpId,
      stopName: stpDe,
      route,
      arrivals,
    }

    // cache final result for 30s
    try {
      await redis.set(cacheKey, JSON.stringify(result), "EX", 30)
    } catch (cacheErr) {
      console.warn("Redis caching failed:", cacheErr)
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("Error in Stop Arrivals API route:", error)
    return NextResponse.json(
      { error: "Server error.", details: error?.message },
      { status: 500 }
    )
  }
}