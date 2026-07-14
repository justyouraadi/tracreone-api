import "./lib/bigint";
import app from "./app";
import { logger } from "./lib/logger";
import { connectRedis, redisConnection } from "./config/redis";
import { prisma } from "./config/prisma";
import { ensurePermissionCatalogSeeded } from "./modules/roles/role.controller";

void connectRedis();
ensurePermissionCatalogSeeded().catch((err) => {
  logger.error({ err }, "Failed to seed permission catalog");
});

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const server = app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});

// Graceful shutdown: stop accepting new connections, let in-flight requests
// finish, then close the Prisma and Redis connections cleanly. Without this,
// SIGTERM (sent by container orchestrators/deploy rollouts) kills the
// process immediately, dropping in-flight requests and leaving DB/Redis
// sockets to be cleaned up by the OS rather than closed properly.
let shuttingDown = false;

async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info({ signal }, "Received shutdown signal, closing gracefully");

  const forceExitTimer = setTimeout(() => {
    logger.warn("Graceful shutdown timed out, forcing exit");
    process.exit(1);
  }, 10_000);
  forceExitTimer.unref();

  server.close(async (err) => {
    if (err) logger.error({ err }, "Error closing HTTP server");

    try {
      await prisma.$disconnect();
    } catch (disconnectErr) {
      logger.warn({ err: disconnectErr }, "Error disconnecting Prisma");
    }

    try {
      redisConnection.disconnect();
    } catch (disconnectErr) {
      logger.warn({ err: disconnectErr }, "Error disconnecting Redis");
    }

    clearTimeout(forceExitTimer);
    logger.info("Shutdown complete");
    process.exit(0);
  });
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
