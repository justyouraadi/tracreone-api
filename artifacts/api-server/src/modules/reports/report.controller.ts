import type { Request, Response } from "express";
import { prisma } from "../../config/prisma";
import type { AuthenticatedRequest } from "../../middlewares/auth";
import { toCsv } from "../../lib/csv";

function parseDateRange(req: Request) {
  const from = req.query.from ? new Date(String(req.query.from)) : null;
  const to = req.query.to ? new Date(String(req.query.to)) : null;
  return { from, to };
}

export async function getLeadsReport(req: AuthenticatedRequest, res: Response) {
  const companyId = req.auth!.companyId!;
  const { from, to } = parseDateRange(req);
  const format = String(req.query.format ?? "json");

  const where = {
    companyId,
    ...(from || to
      ? {
          timestamp: {
            ...(from ? { gte: BigInt(from.getTime()) } : {}),
            ...(to ? { lte: BigInt(to.getTime()) } : {}),
          },
        }
      : {}),
  };

  const leads = await prisma.leads.findMany({
    where,
    orderBy: { id: "desc" },
    include: { stage: true, leadSource: true, campaign: true },
  });

  const rows = leads.map((lead) => ({
    id: lead.id,
    name: lead.name,
    phone: lead.phone,
    status: lead.status,
    stage: lead.stage?.name ?? "",
    source: lead.leadSource?.name ?? lead.source ?? "",
    campaign: lead.campaign?.name ?? "",
    propertyInterest: lead.propertyinterest,
    budget: lead.budget,
    createdAt: lead.timestamp ? new Date(Number(lead.timestamp)).toISOString() : "",
  }));

  if (format === "csv") {
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=leads-report.csv");
    res.send(toCsv(rows));
    return;
  }

  res.json({ leads: rows, total: rows.length });
}

export async function getFollowUpsReport(req: AuthenticatedRequest, res: Response) {
  const companyId = req.auth!.companyId!;
  const format = String(req.query.format ?? "json");

  const followUps = await prisma.followUp.findMany({
    where: { companyId },
    orderBy: { dueAt: "asc" },
    include: { lead: { select: { name: true, phone: true } }, assignedTo: { select: { name: true } } },
  });

  const rows = followUps.map((f) => ({
    id: f.id,
    lead: f.lead.name,
    leadPhone: f.lead.phone,
    assignedTo: f.assignedTo?.name ?? "",
    type: f.type,
    status: f.status,
    dueAt: f.dueAt.toISOString(),
    completedAt: f.completedAt?.toISOString() ?? "",
  }));

  if (format === "csv") {
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=follow-ups-report.csv");
    res.send(toCsv(rows));
    return;
  }

  res.json({ followUps: rows, total: rows.length });
}

export async function getActivityReport(req: AuthenticatedRequest, res: Response) {
  const companyId = req.auth!.companyId!;
  const { from, to } = parseDateRange(req);

  const logs = await prisma.activityLog.findMany({
    where: {
      companyId,
      ...(from || to
        ? {
            createdAt: {
              ...(from ? { gte: from } : {}),
              ...(to ? { lte: to } : {}),
            },
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 1000,
    include: { user: { select: { name: true } } },
  });

  res.json({
    activity: logs.map((log) => ({
      id: log.id,
      action: log.action,
      user: log.user?.name ?? "system",
      leadId: log.leadId,
      metadata: log.metadata,
      createdAt: log.createdAt.toISOString(),
    })),
  });
}
