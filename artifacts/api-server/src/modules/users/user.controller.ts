import type { Response } from "express";
import { prisma } from "../../config/prisma";
import type { AuthenticatedRequest } from "../../middlewares/auth";
import { ApiError } from "../../middlewares/errorHandler";
import { hashPassword } from "../../lib/password";
import { toPublicUser } from "../auth/auth.service";

export async function listUsers(req: AuthenticatedRequest, res: Response) {
  const companyId = req.auth!.companyId;
  const users = await prisma.user.findMany({
    where: companyId ? { companyId } : undefined,
    orderBy: { createdAt: "desc" },
  });
  res.json({ users: users.map(toPublicUser) });
}

export async function createUser(req: AuthenticatedRequest, res: Response) {
  const companyId = req.auth!.companyId;
  if (!companyId) throw new ApiError(400, "No company associated with this account");

  const existing = await prisma.user.findUnique({ where: { email: req.body.email } });
  if (existing) throw new ApiError(409, "A user with this email already exists");

  const passwordHash = await hashPassword(req.body.password);
  const user = await prisma.user.create({
    data: {
      companyId,
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      role: req.body.role,
      passwordHash,
    },
  });

  res.status(201).json({ user: toPublicUser(user) });
}

export async function getUser(req: AuthenticatedRequest, res: Response) {
  const user = await prisma.user.findUnique({ where: { id: Number(req.params.id) } });
  if (!user) throw new ApiError(404, "User not found");
  if (req.auth!.role !== "super_admin" && user.companyId !== req.auth!.companyId) {
    throw new ApiError(404, "User not found");
  }
  res.json({ user: toPublicUser(user) });
}

export async function updateUser(req: AuthenticatedRequest, res: Response) {
  const id = Number(req.params.id);
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "User not found");
  if (req.auth!.role !== "super_admin" && existing.companyId !== req.auth!.companyId) {
    throw new ApiError(404, "User not found");
  }

  const user = await prisma.user.update({ where: { id }, data: req.body });
  res.json({ user: toPublicUser(user) });
}

export async function deleteUser(req: AuthenticatedRequest, res: Response) {
  const id = Number(req.params.id);
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "User not found");
  if (req.auth!.role !== "super_admin" && existing.companyId !== req.auth!.companyId) {
    throw new ApiError(404, "User not found");
  }

  await prisma.user.update({ where: { id }, data: { isActive: false } });
  res.status(204).send();
}
