import type { Response, Request } from "express";
import type { z } from "zod";
import { prisma } from "../../config/prisma";
import type { AuthenticatedRequest } from "../../middlewares/auth";
import { ApiError } from "../../middlewares/errorHandler";
import type { listFollowUpsQuerySchema } from "./followup.schema";
import { scheduleFollowUpReminder } from "../../queues";
import { logger } from "../../lib/logger";

export async function listFollowUps(req: AuthenticatedRequest, res: Response) {
  const query = (req as Request & { validatedQuery: z.infer<typeof listFollowUpsQuerySchema> }).validatedQuery;
  const followUps = await prisma.followUp.findMany({
    where: {
      companyId: req.auth!.companyId,
      status: query.status,
      assignedToId: query.assignedToId,
      leadId: query.leadId,
    },
    orderBy: { dueAt: "asc" },
    include: { lead: true },
    // Hard cap to keep the response bounded as data grows (soonest-due items
    // are returned first). Fetch one extra row to detect truncation; `hasMore`
    // is an additive field so existing clients are unaffected.
    take: 501,
  });
  const hasMore = followUps.length > 500;
  res.json({ followUps: hasMore ? followUps.slice(0, 500) : followUps, hasMore });
}

export async function createFollowUp(req: AuthenticatedRequest, res: Response) {
  const lead = await prisma.leads.findUnique({ where: { id: req.body.leadId } });
  if (!lead || (lead.companyId !== null && lead.companyId !== req.auth!.companyId)) {
    throw new ApiError(404, "Lead not found");
  }

  const followUp = await prisma.followUp.create({
    data: { ...req.body, companyId: req.auth!.companyId },
  });

  scheduleFollowUpReminder({ followUpId: followUp.id, leadId: followUp.leadId }, followUp.dueAt).catch((err) =>
    logger.warn({ err, followUpId: followUp.id }, "Could not schedule follow-up reminder (Redis unavailable?)"),
  );

  res.status(201).json({ followUp });
}

async function assertOwnedFollowUp(id: number, companyId: number | null) {
  const followUp = await prisma.followUp.findUnique({ where: { id } });
  if (!followUp || followUp.companyId !== companyId) throw new ApiError(404, "Follow-up not found");
  return followUp;
}

export async function updateFollowUp(req: AuthenticatedRequest, res: Response) {
  const id = Number(req.params.id);
  await assertOwnedFollowUp(id, req.auth!.companyId);
  const data: Record<string, unknown> = { ...req.body };
  if (req.body.status === "completed") data.completedAt = new Date();
  const followUp = await prisma.followUp.update({ where: { id }, data });
  res.json({ followUp });
}

export async function deleteFollowUp(req: AuthenticatedRequest, res: Response) {
  const id = Number(req.params.id);
  await assertOwnedFollowUp(id, req.auth!.companyId);
  await prisma.followUp.delete({ where: { id } });
  res.status(204).send();
}
