import type { Response } from "express";
import { prisma } from "../../config/prisma";
import type { AuthenticatedRequest } from "../../middlewares/auth";
import { ApiError } from "../../middlewares/errorHandler";

export async function listCustomFields(req: AuthenticatedRequest, res: Response) {
  const customFields = await prisma.customField.findMany({
    where: { companyId: req.auth!.companyId!, isActive: true },
    orderBy: { order: "asc" },
  });
  res.json({ customFields });
}

export async function createCustomField(req: AuthenticatedRequest, res: Response) {
  const customField = await prisma.customField.create({
    data: { ...req.body, options: req.body.options ?? undefined, companyId: req.auth!.companyId! },
  });
  res.status(201).json({ customField });
}

async function assertOwned(id: number, companyId: number) {
  const field = await prisma.customField.findUnique({ where: { id } });
  if (!field || field.companyId !== companyId) throw new ApiError(404, "Custom field not found");
  return field;
}

export async function updateCustomField(req: AuthenticatedRequest, res: Response) {
  const id = Number(req.params.id);
  await assertOwned(id, req.auth!.companyId!);
  const customField = await prisma.customField.update({ where: { id }, data: req.body });
  res.json({ customField });
}

export async function deleteCustomField(req: AuthenticatedRequest, res: Response) {
  const id = Number(req.params.id);
  await assertOwned(id, req.auth!.companyId!);
  await prisma.customField.update({ where: { id }, data: { isActive: false } });
  res.status(204).send();
}

async function assertScopedLead(id: number, req: AuthenticatedRequest) {
  const lead = await prisma.leads.findUnique({ where: { id } });
  if (!lead) throw new ApiError(404, "Lead not found");
  if (req.auth!.role !== "super_admin" && lead.companyId !== null && lead.companyId !== req.auth!.companyId) {
    throw new ApiError(404, "Lead not found");
  }
  return lead;
}

export async function getLeadCustomFieldValues(req: AuthenticatedRequest, res: Response) {
  const lead = await assertScopedLead(Number(req.params.leadId), req);
  const values = await prisma.customFieldValue.findMany({
    where: { leadId: lead.id },
    include: { customField: true },
  });
  res.json({ values });
}

export async function setLeadCustomFieldValue(req: AuthenticatedRequest, res: Response) {
  const lead = await assertScopedLead(Number(req.params.leadId), req);
  const field = await prisma.customField.findUnique({ where: { id: req.body.customFieldId } });
  if (!field || field.companyId !== req.auth!.companyId) throw new ApiError(404, "Custom field not found");

  const value = await prisma.customFieldValue.upsert({
    where: { customFieldId_leadId: { customFieldId: field.id, leadId: lead.id } },
    create: { customFieldId: field.id, leadId: lead.id, value: req.body.value },
    update: { value: req.body.value },
  });
  res.status(200).json({ value });
}
