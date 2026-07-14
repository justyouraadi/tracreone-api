import "../config/database";
import { Worker } from "bullmq";
import { queueConnectionOptions } from "../config/redis";
import { NOTIFICATION_QUEUE, FOLLOW_UP_QUEUE, type NotificationJob, type FollowUpReminderJob } from "./index";
import { prisma } from "../config/prisma";
import { logger } from "../lib/logger";

// This worker process handles background jobs (notifications, follow-up
// reminders). Run it separately from the HTTP server, e.g. via
// `node dist/worker.mjs` or a dedicated container/process in Docker.

export const notificationWorker = new Worker<NotificationJob>(
  NOTIFICATION_QUEUE,
  async (job) => {
    logger.info({ jobId: job.id, userId: job.data.userId }, "Processing notification job");
    // NOTE: no push/email/SMS provider is connected yet. Wire this up to
    // FCM/APNs/email once those integrations are configured.
  },
  { connection: queueConnectionOptions },
);

export const followUpWorker = new Worker<FollowUpReminderJob>(
  FOLLOW_UP_QUEUE,
  async (job) => {
    const followUp = await prisma.followUp.findUnique({ where: { id: job.data.followUpId } });
    if (!followUp || followUp.status !== "pending") return;
    logger.info({ followUpId: followUp.id, leadId: followUp.leadId }, "Follow-up reminder due");
    // NOTE: hook this into the notification queue / WhatsApp / AI calling
    // module once those provider integrations are connected.
  },
  { connection: queueConnectionOptions },
);

for (const worker of [notificationWorker, followUpWorker]) {
  worker.on("failed", (job, err) => {
    logger.error({ jobId: job?.id, err }, "Background job failed");
  });
}

// Graceful shutdown: let in-flight jobs finish (worker.close() waits for
// active jobs), then release Prisma. Mirrors the API server's handlers so
// orchestrators (Docker/K8s SIGTERM) never kill jobs mid-processing.
let shuttingDown = false;
async function shutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info({ signal }, "Worker shutting down gracefully");

  const forceExit = setTimeout(() => {
    logger.error("Worker forced shutdown after timeout");
    process.exit(1);
  }, 30_000);
  forceExit.unref();

  try {
    await Promise.all([notificationWorker.close(), followUpWorker.close()]);
    await prisma.$disconnect();
    logger.info("Worker shutdown complete");
    process.exit(0);
  } catch (err) {
    logger.error({ err }, "Error during worker shutdown");
    process.exit(1);
  }
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));

logger.info("Background workers started");
