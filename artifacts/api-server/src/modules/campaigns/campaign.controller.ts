import type { Request, Response } from "express";
import type { z } from "zod";
import { prisma } from "../../config/prisma";
import type { AuthenticatedRequest } from "../../middlewares/auth";
import { ApiError } from "../../middlewares/errorHandler";
import { logActivity } from "../activity/activity.service";
import type { listCampaignsQuerySchema } from "./campaign.schema";

async function assertOwned(id: number, companyId: number) {
  const campaign = await prisma.campaign.findUnique({ where: { id } });
  if (!campaign || campaign.companyId !== companyId) throw new ApiError(404, "Campaign not found");
  return campaign;
}

export async function listCampaigns(req: AuthenticatedRequest, res: Response) {
  const query = (req as Request & { validatedQuery: z.infer<typeof listCampaignsQuerySchema> }).validatedQuery;
  const companyId = req.auth!.companyId!;
  const where = { companyId, ...(query.status ? { status: query.status } : {}) };

  const [campaigns, total] = await Promise.all([
    prisma.campaign.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: { _count: { select: { leads: true } } },
    }),
    prisma.campaign.count({ where }),
  ]);

  res.json({ campaigns, pagination: { page: query.page, pageSize: query.pageSize, total } });
}

export async function getCampaign(req: AuthenticatedRequest, res: Response) {
  const campaign = await assertOwned(Number(req.params.id), req.auth!.companyId!);
  const leadCount = await prisma.leads.count({ where: { campaignId: campaign.id } });
  res.json({ campaign: { ...campaign, leadCount } });
}

export async function createCampaign(req: AuthenticatedRequest, res: Response) {
  const campaign = await prisma.campaign.create({
    data: { ...req.body, companyId: req.auth!.companyId!, createdBy: req.auth!.sub },
  });
  await logActivity({ companyId: req.auth!.companyId, userId: req.auth!.sub, action: "campaign.created", metadata: { campaignId: campaign.id } });
  res.status(201).json({ campaign });
}

export async function updateCampaign(req: AuthenticatedRequest, res: Response) {
  const existing = await assertOwned(Number(req.params.id), req.auth!.companyId!);
  const campaign = await prisma.campaign.update({ where: { id: existing.id }, data: req.body });
  await logActivity({ companyId: req.auth!.companyId, userId: req.auth!.sub, action: "campaign.updated", metadata: { campaignId: campaign.id } });
  res.json({ campaign });
}

export async function deleteCampaign(req: AuthenticatedRequest, res: Response) {
  const existing = await assertOwned(Number(req.params.id), req.auth!.companyId!);
  await prisma.campaign.delete({ where: { id: existing.id } });
  res.status(204).send();
}

export async function getCampaignPerformance(req: AuthenticatedRequest, res: Response) {
  const campaign = await assertOwned(Number(req.params.id), req.auth!.companyId!);
  const [totalLeads, byStatus] = await Promise.all([
    prisma.leads.count({ where: { campaignId: campaign.id } }),
    prisma.leads.groupBy({ by: ["status"], where: { campaignId: campaign.id }, _count: { _all: true } }),
  ]);
  res.json({
    campaignId: campaign.id,
    totalLeads,
    byStatus: byStatus.map((row) => ({ status: row.status, count: row._count._all })),
  });
}
