import { Router, type IRouter } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma";
import { redisConnection } from "../config/redis";

const HealthCheckResponse = z.object({ status: z.string() });

const router: IRouter = Router();

// Liveness probe: process is up and can respond. Does not touch
// dependencies, so it stays fast and cheap for frequent orchestrator polling.
router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

// Readiness probe: verifies the app can actually serve traffic by checking
// its real dependencies. DB is required (fails readiness if unreachable);
// Redis is optional (the app degrades gracefully without it), so it is
// reported but never fails readiness on its own.
router.get("/readyz", async (_req, res) => {
  const checks: Record<string, "ok" | "error"> = { database: "ok", redis: "ok" };
  let ready = true;

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    checks.database = "error";
    ready = false;
  }

  if (redisConnection.status !== "ready" && redisConnection.status !== "connecting") {
    checks.redis = "error";
  }

  res.status(ready ? 200 : 503).json({ status: ready ? "ok" : "degraded", checks });
});

export default router;
