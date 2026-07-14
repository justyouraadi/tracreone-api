import type { Response } from "express";
import { prisma } from "../../config/prisma";
import type { AuthenticatedRequest } from "../../middlewares/auth";
import { ApiError } from "../../middlewares/errorHandler";

export async function listStages(req: AuthenticatedRequest, res: Response) {
  const stages = await prisma.pipelineStage.findMany({
    where: { companyId: req.auth!.companyId! },
    orderBy: { order: "asc" },
  });
  res.json({ stages });
}

export async function createStage(req: AuthenticatedRequest, res: Response) {
  const stage = await prisma.pipelineStage.create({
    data: { ...req.body, companyId: req.auth!.companyId! },
  });
  res.status(201).json({ stage });
}

async function assertOwnedStage(id: number, companyId: number) {
  const stage = await prisma.pipelineStage.findUnique({ where: { id } });
  if (!stage || stage.companyId !== companyId) throw new ApiError(404, "Pipeline stage not found");
  return stage;
}

export async function updateStage(req: AuthenticatedRequest, res: Response) {
  const id = Number(req.params.id);
  await assertOwnedStage(id, req.auth!.companyId!);
  const stage = await prisma.pipelineStage.update({ where: { id }, data: req.body });
  res.json({ stage });
}

export async function deleteStage(req: AuthenticatedRequest, res: Response) {
  const id = Number(req.params.id);
  await assertOwnedStage(id, req.auth!.companyId!);
  await prisma.pipelineStage.delete({ where: { id } });
  res.status(204).send();
}
