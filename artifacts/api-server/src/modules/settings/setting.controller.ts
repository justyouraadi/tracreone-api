import type { Response } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import type { AuthenticatedRequest } from "../../middlewares/auth";
import { ApiError } from "../../middlewares/errorHandler";

export async function listSettings(req: AuthenticatedRequest, res: Response) {
  const settings = await prisma.setting.findMany({ where: { companyId: req.auth!.companyId! } });
  res.json({ settings: Object.fromEntries(settings.map((s) => [s.key, s.value])) });
}

export async function getSetting(req: AuthenticatedRequest, res: Response) {
  const key = String(req.params.key);
  const setting = await prisma.setting.findUnique({
    where: { companyId_key: { companyId: req.auth!.companyId!, key } },
  });
  if (!setting) throw new ApiError(404, "Setting not found");
  res.json({ key: setting.key, value: setting.value });
}

export async function upsertSetting(req: AuthenticatedRequest, res: Response) {
  const companyId = req.auth!.companyId!;
  const key = String(req.params.key);
  const setting = await prisma.setting.upsert({
    where: { companyId_key: { companyId, key } },
    create: { companyId, key, value: req.body.value as Prisma.InputJsonValue },
    update: { value: req.body.value as Prisma.InputJsonValue },
  });
  res.json({ key: setting.key, value: setting.value });
}

export async function deleteSetting(req: AuthenticatedRequest, res: Response) {
  const companyId = req.auth!.companyId!;
  const key = String(req.params.key);
  const existing = await prisma.setting.findUnique({ where: { companyId_key: { companyId, key } } });
  if (!existing) throw new ApiError(404, "Setting not found");
  await prisma.setting.delete({ where: { companyId_key: { companyId, key } } });
  res.status(204).send();
}
