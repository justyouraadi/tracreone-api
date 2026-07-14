import type { Response } from "express";
import { prisma } from "../../config/prisma";
import type { AuthenticatedRequest } from "../../middlewares/auth";
import { ApiError } from "../../middlewares/errorHandler";

export async function listLeadStatuses(req: AuthenticatedRequest, res: Response) {
  const leadStatuses = await prisma.leadStatus.findMany({
    where: { companyId: req.auth!.companyId! },
    orderBy: { order: "asc" },
  });
  res.json({ leadStatuses });
}

export async function createLeadStatus(req: AuthenticatedRequest, res: Response) {
  const companyId = req.auth!.companyId!;
  if (req.body.isDefault) {
    await prisma.leadStatus.updateMany({ where: { companyId }, data: { isDefault: false } });
  }
  const leadStatus = await prisma.leadStatus.create({ data: { ...req.body, companyId } });
  res.status(201).json({ leadStatus });
}

async function assertOwned(id: number, companyId: number) {
  const status = await prisma.leadStatus.findUnique({ where: { id } });
  if (!status || status.companyId !== companyId) throw new ApiError(404, "Lead status not found");
  return status;
}

export async function updateLeadStatus(req: AuthenticatedRequest, res: Response) {
  const id = Number(req.params.id);
  const companyId = req.auth!.companyId!;
  await assertOwned(id, companyId);
  if (req.body.isDefault) {
    await prisma.leadStatus.updateMany({ where: { companyId }, data: { isDefault: false } });
  }
  const leadStatus = await prisma.leadStatus.update({ where: { id }, data: req.body });
  res.json({ leadStatus });
}

export async function deleteLeadStatus(req: AuthenticatedRequest, res: Response) {
  const id = Number(req.params.id);
  await assertOwned(id, req.auth!.companyId!);
  await prisma.leadStatus.delete({ where: { id } });
  res.status(204).send();
}
