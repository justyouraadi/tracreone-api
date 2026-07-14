import IORedis from "ioredis";
import { logger } from "../lib/logger";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

export const redisConnection = new IORedis(REDIS_URL, {
  maxRetriesPerRequest: null,
  lazyConnect: true,
  retryStrategy(times) {
    if (times > 3) return null; // stop retrying; app works fine without Redis, just no background jobs
    return Math.min(times * 500, 2000);
  },
});

// BullMQ bundles its own copy of ioredis internally, whose types can conflict
// with the workspace's ioredis version. Pass plain connection options
// (rather than a shared `Redis` instance) to Queue/Worker to avoid that.
export const queueConnectionOptions = {
  url: REDIS_URL,
  maxRetriesPerRequest: null as null,
  retryStrategy(times: number) {
    if (times > 3) return null;
    return Math.min(times * 500, 2000);
  },
};

let loggedError = false;
redisConnection.on("error", (err) => {
  if (!loggedError) {
    logger.warn({ err }, "Redis connection error (queues/jobs will be unavailable until REDIS_URL is reachable)");
    loggedError = true;
  }
});

let connectAttempted = false;

export async function connectRedis(): Promise<void> {
  if (connectAttempted) return;
  connectAttempted = true;
  try {
    await redisConnection.connect();
    logger.info("Connected to Redis");
  } catch (err) {
    logger.warn({ err }, "Could not connect to Redis at startup; will retry lazily on first job");
  }
}
