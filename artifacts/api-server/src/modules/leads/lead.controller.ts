import type { Response, Request } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import type { AuthenticatedRequest } from "../../middlewares/auth";
import { ApiError } from "../../middlewares/errorHandler";
import { logActivity } from "../activity/activity.service";
import type { z } from "zod";
import type { listLeadsQuerySchema } from "./lead.schema";

async function assertScopedLead(id: number, req: AuthenticatedRequest) {
  const lead = await prisma.leads.findUnique({ where: { id } });
  if (!lead) throw new ApiError(404, "Lead not found");
  if (req.auth!.role !== "super_admin" && lead.companyId !== null && lead.companyId !== req.auth!.companyId) {
    throw new ApiError(404, "Lead not found");
  }
  return lead;
}

export async function listLeads(req: AuthenticatedRequest, res: Response) {
  const query = (req as Request & { validatedQuery: z.infer<typeof listLeadsQuerySchema> }).validatedQuery;
  const companyId = req.auth!.companyId;

  const where: Prisma.leadsWhereInput = {};
  if (req.auth!.role !== "super_admin") where.companyId = companyId;
  if (query.status) where.status = query.status;
  if (query.assignedTo !== undefined) where.assignedTo = query.assignedTo;
  if (query.ownerId !== undefined) where.ownerId = query.ownerId;
  if (query.stageId !== undefined) where.stageId = query.stageId;
  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: "insensitive" } },
      { phone: { contains: query.search, mode: "insensitive" } },
    ];
  }

  const [leads, total] = await Promise.all([
    prisma.leads.findMany({
      where,
      orderBy: { id: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: { leadTags: { include: { tag: true } }, stage: true },
    }),
    prisma.leads.count({ where }),
  ]);

  res.json({ leads, pagination: { page: query.page, pageSize: query.pageSize, total } });
}

export async function getLead(req: AuthenticatedRequest, res: Response) {
  const lead = await assertScopedLead(Number(req.params.id), req);
  const full = await prisma.leads.findUnique({
    where: { id: lead.id },
    include: {
      leadTags: { include: { tag: true } },
      leadNotes: { orderBy: { createdAt: "desc" } },
      followUps: { orderBy: { dueAt: "asc" } },
      stage: true,
    },
  });
  res.json({ lead: full });
}

export async function createLead(req: AuthenticatedRequest, res: Response) {
  const lead = await prisma.leads.create({
    data: {
      ...req.body,
      companyId: req.auth!.companyId,
      createdBy: req.auth!.sub,
      timestamp: BigInt(Date.now()),
    },
  });
  await logActivity({ companyId: req.auth!.companyId, userId: req.auth!.sub, leadId: lead.id, action: "lead.created" });
  res.status(201).json({ lead });
}

export async function updateLead(req: AuthenticatedRequest, res: Response) {
  const existing = await assertScopedLead(Number(req.params.id), req);
  const lead = await prisma.leads.update({
    where: { id: existing.id },
    data: { ...req.body, updatedBy: req.auth!.sub },
  });
  await logActivity({ companyId: req.auth!.companyId, userId: req.auth!.sub, leadId: lead.id, action: "lead.updated", metadata: req.body });
  res.json({ lead });
}

export async function deleteLead(req: AuthenticatedRequest, res: Response) {
  const existing = await assertScopedLead(Number(req.params.id), req);
  await prisma.leads.delete({ where: { id: existing.id } });
  await logActivity({ companyId: req.auth!.companyId, userId: req.auth!.sub, leadId: existing.id, action: "lead.deleted" });
  res.status(204).send();
}

export async function assignLead(req: AuthenticatedRequest, res: Response) {
  const existing = await assertScopedLead(Number(req.params.id), req);
  const lead = await prisma.leads.update({
    where: { id: existing.id },
    data: { assignedTo: req.body.assignedTo, updatedBy: req.auth!.sub },
  });
  await logActivity({
    companyId: req.auth!.companyId,
    userId: req.auth!.sub,
    leadId: lead.id,
    action: "lead.assigned",
    metadata: { assignedTo: req.body.assignedTo },
  });
  res.json({ lead });
}

export async function addNote(req: AuthenticatedRequest, res: Response) {
  const existing = await assertScopedLead(Number(req.params.id), req);
  const note = await prisma.leadNote.create({
    data: { leadId: existing.id, userId: req.auth!.sub, content: req.body.content },
  });
  await logActivity({ companyId: req.auth!.companyId, userId: req.auth!.sub, leadId: existing.id, action: "lead.note_added" });
  res.status(201).json({ note });
}

export async function attachTag(req: AuthenticatedRequest, res: Response) {
  const existing = await assertScopedLead(Number(req.params.id), req);
  const tag = await prisma.tag.findUnique({ where: { id: req.body.tagId } });
  if (!tag || tag.companyId !== req.auth!.companyId) throw new ApiError(404, "Tag not found");

  const leadTag = await prisma.leadTag.upsert({
    where: { leadId_tagId: { leadId: existing.id, tagId: tag.id } },
    create: { leadId: existing.id, tagId: tag.id },
    update: {},
  });
  res.status(201).json({ leadTag });
}

export async function detachTag(req: AuthenticatedRequest, res: Response) {
  const existing = await assertScopedLead(Number(req.params.id), req);
  await prisma.leadTag.deleteMany({ where: { leadId: existing.id, tagId: Number(req.params.tagId) } });
  res.status(204).send();
}
