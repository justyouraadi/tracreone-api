import type { Request, Response } from "express";
import * as authService from "./auth.service";
import type { AuthenticatedRequest } from "../../middlewares/auth";
import { prisma } from "../../config/prisma";
import { ApiError } from "../../middlewares/errorHandler";

export async function register(req: Request, res: Response) {
  const result = await authService.registerCompanyOwner(req.body);
  res.status(201).json({
    user: authService.toPublicUser(result.user),
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
  });
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  const result = await authService.loginWithPassword(email, password);
  res.json({
    user: authService.toPublicUser(result.user),
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
  });
}

export async function refresh(req: Request, res: Response) {
  const { refreshToken } = req.body;
  const result = await authService.refreshSession(refreshToken);
  res.json({
    user: authService.toPublicUser(result.user),
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
  });
}

export async function logout(req: Request, res: Response) {
  const { refreshToken } = req.body;
  await authService.logout(refreshToken);
  res.status(204).send();
}

export async function requestOtp(req: Request, res: Response) {
  const { phone } = req.body;
  const result = await authService.requestOtp(phone);
  res.json(result);
}

export async function verifyOtp(req: Request, res: Response) {
  const { phone, code, name } = req.body;
  const result = await authService.verifyOtp(phone, code, name);
  res.json({
    user: authService.toPublicUser(result.user),
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
  });
}

export async function me(req: AuthenticatedRequest, res: Response) {
  if (!req.auth) throw new ApiError(401, "Authentication required");
  const user = await prisma.user.findUnique({ where: { id: req.auth.sub } });
  if (!user) throw new ApiError(404, "User not found");
  res.json({ user: authService.toPublicUser(user) });
}
