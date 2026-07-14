import { prisma } from "../config/prisma";
import { enqueueNotification } from "../queues";
import { logger } from "./logger";
import type { Prisma } from "@prisma/client";

export interface CreateNotificationInput {
  companyId?: number | null;
  userId: number;
  title: string;
  message: string;
  type?: string;
  metadata?: Record<string, unknown>;
}

export async function createNotification(input: CreateNotificationInput) {
  const notification = await prisma.notification.create({
    data: {
      companyId: input.companyId ?? null,
      userId: input.userId,
      title: input.title,
      message: input.message,
      type: input.type ?? "info",
      metadata: input.metadata as Prisma.InputJsonObject | undefined,
    },
  });

  enqueueNotification({ userId: input.userId, title: input.title, body: input.message }).catch((err) => {
    logger.warn({ err, notificationId: notification.id }, "Could not enqueue notification delivery (Redis unavailable?)");
  });

  return notification;
}
