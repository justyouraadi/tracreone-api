import type { Response } from "express";
import { prisma } from "../../config/prisma";
import type { AuthenticatedRequest } from "../../middlewares/auth";
import { ApiError } from "../../middlewares/errorHandler";

export async function listLeadSources(req: AuthenticatedRequest, res: Response) {
  const leadSources = await prisma.leadSource.findMany({
    where: { companyId: req.auth!.companyId! },
    orderBy: { name: "asc" },
  });
  res.json({ leadSources });
}

export async function createLeadSource(req: AuthenticatedRequest, res: Response) {
  const leadSource = await prisma.leadSource.create({ data: { ...req.body, companyId: req.auth!.companyId! } });
  res.status(201).json({ leadSource });
}

async function assertOwned(id: number, companyId: number) {
  const source = await prisma.leadSource.findUnique({ where: { id } });
  if (!source || source.companyId !== companyId) throw new ApiError(404, "Lead source not found");
  return source;
}

export async function updateLeadSource(req: AuthenticatedRequest, res: Response) {
  const id = Number(req.params.id);
  await assertOwned(id, req.auth!.companyId!);
  const leadSource = await prisma.leadSource.update({ where: { id }, data: req.body });
  res.json({ leadSource });
}

export async function deleteLeadSource(req: AuthenticatedRequest, res: Response) {
  const id = Number(req.params.id);
  await assertOwned(id, req.auth!.companyId!);
  await prisma.leadSource.delete({ where: { id } });
  res.status(204).send();
}
