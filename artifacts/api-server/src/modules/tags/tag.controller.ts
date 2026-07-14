import type { Response } from "express";
import { prisma } from "../../config/prisma";
import type { AuthenticatedRequest } from "../../middlewares/auth";
import { ApiError } from "../../middlewares/errorHandler";

export async function listTags(req: AuthenticatedRequest, res: Response) {
  const tags = await prisma.tag.findMany({ where: { companyId: req.auth!.companyId! }, orderBy: { name: "asc" } });
  res.json({ tags });
}

export async function createTag(req: AuthenticatedRequest, res: Response) {
  const tag = await prisma.tag.create({ data: { ...req.body, companyId: req.auth!.companyId! } });
  res.status(201).json({ tag });
}

export async function deleteTag(req: AuthenticatedRequest, res: Response) {
  const id = Number(req.params.id);
  const tag = await prisma.tag.findUnique({ where: { id } });
  if (!tag || tag.companyId !== req.auth!.companyId) throw new ApiError(404, "Tag not found");
  await prisma.tag.delete({ where: { id } });
  res.status(204).send();
}
