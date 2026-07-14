import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { logger } from "../../lib/logger";

export async function logActivity(entry: {
  companyId?: number | null;
  userId?: number | null;
  leadId?: number | null;
  action: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await prisma.activityLog.create({
      data: {
        companyId: entry.companyId ?? null,
        userId: entry.userId ?? null,
        leadId: entry.leadId ?? null,
        action: entry.action,
        metadata: entry.metadata ? (entry.metadata as Prisma.InputJsonObject) : Prisma.JsonNull,
      },
    });
  } catch (err) {
    logger.error({ err }, "Failed to write activity log");
  }
}
