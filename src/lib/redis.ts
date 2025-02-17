import Redis from "ioredis";

/**
 * Creates a Redis client instance using the Railway Redis URL
 * Includes error handling and reconnection logic
 */
const redis = new Redis(process.env.REDIS_URL!, {
  // Retry strategy for reconnection
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  // Maximum number of retries per request
  maxRetriesPerRequest: 3,
  // Enable auto-reconnect
  reconnectOnError: (err) => {
    const targetError = "READONLY";
    if (err.message.includes(targetError)) {
      return true;
    }
    return false;
  },
});

// Add error event handler
redis.on("error", (error) => {
  console.error("Redis connection error:", error);
});

// Add connection event handlers for debugging
redis.on("connect", () => {
  console.log("Connected to Redis");
});

redis.on("ready", () => {
  console.log("Redis client ready");
});

export default redis;