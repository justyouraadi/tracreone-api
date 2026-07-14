import type { Response } from "express";
import { prisma } from "../../config/prisma";
import type { AuthenticatedRequest } from "../../middlewares/auth";

export async function getDashboardAnalytics(req: AuthenticatedRequest, res: Response) {
  const companyId = req.auth!.companyId!;
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - 7);

  const [totalLeads, newThisWeek, newThisMonth, byStatus, bySource, byStage, activeCampaigns, unreadNotifications] =
    await Promise.all([
      prisma.leads.count({ where: { companyId } }),
      prisma.leads.count({ where: { companyId, timestamp: { gte: BigInt(startOfWeek.getTime()) } } }),
      prisma.leads.count({ where: { companyId, timestamp: { gte: BigInt(startOfMonth.getTime()) } } }),
      prisma.leads.groupBy({ by: ["status"], where: { companyId }, _count: { _all: true } }),
      prisma.leads.groupBy({ by: ["source"], where: { companyId }, _count: { _all: true } }),
      prisma.leads.groupBy({ by: ["stageId"], where: { companyId }, _count: { _all: true } }),
      prisma.campaign.count({ where: { companyId, status: "active" } }),
      prisma.notification.count({ where: { userId: req.auth!.sub, isRead: false } }),
    ]);

  res.json({
    totalLeads,
    newThisWeek,
    newThisMonth,
    activeCampaigns,
    unreadNotifications,
    byStatus: byStatus.map((r) => ({ status: r.status, count: r._count._all })),
    bySource: bySource.map((r) => ({ source: r.source, count: r._count._all })),
    byStage: byStage.map((r) => ({ stageId: r.stageId, count: r._count._all })),
  });
}

export async function getPipelineAnalytics(req: AuthenticatedRequest, res: Response) {
  const companyId = req.auth!.companyId!;
  const stages = await prisma.pipelineStage.findMany({ where: { companyId }, orderBy: { order: "asc" } });

  const counts = await prisma.leads.groupBy({ by: ["stageId"], where: { companyId }, _count: { _all: true } });
  const countByStage = new Map(counts.map((c) => [c.stageId, c._count._all]));

  const funnel = stages.map((stage) => ({
    stageId: stage.id,
    name: stage.name,
    order: stage.order,
    leadCount: countByStage.get(stage.id) ?? 0,
  }));

  const totalInPipeline = funnel.reduce((sum, s) => sum + s.leadCount, 0);
  res.json({ funnel, totalInPipeline });
}

export async function getTeamPerformance(req: AuthenticatedRequest, res: Response) {
  const companyId = req.auth!.companyId!;

  // Fetch users plus all four aggregates as grouped queries instead of
  // looping per-user (which previously issued 4 queries per user — 200+
  // queries for a 50-person team). Each grouped query here is a single
  // round trip regardless of team size.
  const users = await prisma.user.findMany({ where: { companyId, isActive: true } });
  const userIds = users.map((u) => u.id);

  const [assignedByUser, closedByUser, followUpsCompletedByUser, followUpsPendingByUser] = await Promise.all([
    prisma.leads.groupBy({ by: ["assignedTo"], where: { companyId, assignedTo: { not: null } }, _count: { _all: true } }),
    prisma.leads.groupBy({
      by: ["assignedTo"],
      where: { companyId, assignedTo: { not: null }, status: { in: ["won", "closed", "converted"] } },
      _count: { _all: true },
    }),
    prisma.followUp.groupBy({
      by: ["assignedToId"],
      where: { assignedToId: { in: userIds }, status: "completed" },
      _count: { _all: true },
    }),
    prisma.followUp.groupBy({
      by: ["assignedToId"],
      where: { assignedToId: { in: userIds }, status: "pending" },
      _count: { _all: true },
    }),
  ]);

  const assignedMap = new Map(assignedByUser.map((r) => [r.assignedTo, r._count._all]));
  const closedMap = new Map(closedByUser.map((r) => [r.assignedTo, r._count._all]));
  const completedMap = new Map(followUpsCompletedByUser.map((r) => [r.assignedToId, r._count._all]));
  const pendingMap = new Map(followUpsPendingByUser.map((r) => [r.assignedToId, r._count._all]));

  const performance = users.map((user) => {
    const assignedLeads = assignedMap.get(user.id) ?? 0;
    const closedLeads = closedMap.get(user.id) ?? 0;
    return {
      userId: user.id,
      name: user.name,
      role: user.role,
      assignedLeads,
      closedLeads,
      conversionRate: assignedLeads > 0 ? Number(((closedLeads / assignedLeads) * 100).toFixed(1)) : 0,
      followUpsCompleted: completedMap.get(user.id) ?? 0,
      followUpsPending: pendingMap.get(user.id) ?? 0,
    };
  });

  res.json({ performance });
}
