import type { Response } from "express";
import { prisma } from "../../config/prisma";
import type { AuthenticatedRequest } from "../../middlewares/auth";
import { ApiError } from "../../middlewares/errorHandler";
import { DEFAULT_ROLE_PERMISSIONS, PERMISSIONS } from "../../lib/permissions";
import { resolveRolePermissions } from "../../middlewares/rbac";

const ROLES = ["owner", "admin", "manager", "agent"] as const;

export async function listPermissions(_req: AuthenticatedRequest, res: Response) {
  const permissions = await prisma.permission.findMany({ orderBy: { key: "asc" } });
  res.json({ permissions });
}

export async function listRolePermissions(req: AuthenticatedRequest, res: Response) {
  const companyId = req.auth!.companyId!;
  const result: Record<string, string[]> = {};
  for (const role of ROLES) {
    result[role] = Array.from(await resolveRolePermissions(role, companyId));
  }
  res.json({ rolePermissions: result, defaults: DEFAULT_ROLE_PERMISSIONS });
}

export async function updateRolePermissions(req: AuthenticatedRequest, res: Response) {
  const companyId = req.auth!.companyId!;
  const role = String(req.params.role);
  if (!ROLES.includes(role as (typeof ROLES)[number])) throw new ApiError(400, "Unknown role");
  if (role === "owner") throw new ApiError(400, "Owner permissions cannot be modified");

  const { permissionKeys } = req.body as { permissionKeys: string[] };
  const permissions = await prisma.permission.findMany({ where: { key: { in: permissionKeys } } });
  if (permissions.length !== permissionKeys.length) throw new ApiError(400, "One or more permission keys are invalid");

  await prisma.$transaction([
    prisma.rolePermission.deleteMany({ where: { companyId, role } }),
    prisma.rolePermission.createMany({
      data: permissions.map((p) => ({ companyId, role, permissionId: p.id })),
    }),
  ]);

  res.json({ role, permissionKeys: permissions.map((p) => p.key) });
}

// Ensures the `permissions` table has a row for every key in the catalog.
// Safe to call repeatedly (idempotent upsert); invoked on server startup.
export async function ensurePermissionCatalogSeeded() {
  const catalog = Object.entries(PERMISSIONS).map(([, key]) => key);
  for (const key of catalog) {
    await prisma.permission.upsert({
      where: { key },
      create: { key, description: key.replace(/[._]/g, " ") },
      update: {},
    });
  }
}
