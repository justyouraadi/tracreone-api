import type { Response } from "express";
import { prisma } from "../../config/prisma";
import type { AuthenticatedRequest } from "../../middlewares/auth";
import { ApiError } from "../../middlewares/errorHandler";

export async function getCurrentCompany(req: AuthenticatedRequest, res: Response) {
  if (!req.auth?.companyId) throw new ApiError(404, "No company associated with this account");
  const company = await prisma.company.findUnique({ where: { id: req.auth.companyId } });
  if (!company) throw new ApiError(404, "Company not found");
  res.json({ company });
}

export async function updateCurrentCompany(req: AuthenticatedRequest, res: Response) {
  if (!req.auth?.companyId) throw new ApiError(404, "No company associated with this account");
  const company = await prisma.company.update({ where: { id: req.auth.companyId }, data: req.body });
  res.json({ company });
}

export async function listCompanies(_req: AuthenticatedRequest, res: Response) {
  const companies = await prisma.company.findMany({ orderBy: { createdAt: "desc" } });
  res.json({ companies });
}
