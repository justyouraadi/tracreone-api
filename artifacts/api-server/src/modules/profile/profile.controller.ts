import type { Response } from "express";
import { prisma } from "../../config/prisma";
import type { AuthenticatedRequest } from "../../middlewares/auth";
import { ApiError } from "../../middlewares/errorHandler";
import { hashPassword, verifyPassword } from "../../lib/password";
import { toPublicUser } from "../auth/auth.service";

export async function getProfile(req: AuthenticatedRequest, res: Response) {
  const user = await prisma.user.findUnique({ where: { id: req.auth!.sub } });
  if (!user) throw new ApiError(404, "User not found");
  res.json({ user: toPublicUser(user) });
}

export async function updateProfile(req: AuthenticatedRequest, res: Response) {
  const user = await prisma.user.update({ where: { id: req.auth!.sub }, data: req.body });
  res.json({ user: toPublicUser(user) });
}

export async function changePassword(req: AuthenticatedRequest, res: Response) {
  const user = await prisma.user.findUnique({ where: { id: req.auth!.sub } });
  if (!user || !user.passwordHash) throw new ApiError(400, "Password login is not enabled for this account");

  const valid = await verifyPassword(req.body.currentPassword, user.passwordHash);
  if (!valid) throw new ApiError(401, "Current password is incorrect");

  const passwordHash = await hashPassword(req.body.newPassword);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
  res.status(204).send();
}
