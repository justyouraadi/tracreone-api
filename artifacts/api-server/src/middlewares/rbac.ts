import type { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "./auth";
import { prisma } from "../config/prisma";
import { DEFAULT_ROLE_PERMISSIONS, type PermissionKey } from "../lib/permissions";

export function requireRole(...roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.auth) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    if (req.auth.role === "super_admin") {
      next();
      return;
    }

    if (!roles.includes(req.auth.role)) {
      res.status(403).json({ error: "You do not have permission to perform this action" });
      return;
    }

    next();
  };
}

export function requireCompanyScope(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.auth) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  if (req.auth.role !== "super_admin" && !req.auth.companyId) {
    res.status(403).json({ error: "Account is not associated with a company" });
    return;
  }

  next();
}

// Resolves the effective permission set for a role: company-specific overrides
// (`role_permissions` rows scoped to companyId) take priority; otherwise falls
// back to the platform default for that role.
export async function resolveRolePermissions(role: string, companyId: number | null): Promise<Set<string>> {
  if (companyId !== null) {
    const scoped = await prisma.rolePermission.findMany({
      where: { companyId, role },
      include: { permission: true },
    });
    if (scoped.length > 0) return new Set(scoped.map((rp) => rp.permission.key));
  }
  return new Set(DEFAULT_ROLE_PERMISSIONS[role] ?? []);
}

export function requirePermission(permission: PermissionKey) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.auth) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    if (req.auth.role === "super_admin") {
      next();
      return;
    }
    try {
      const permissions = await resolveRolePermissions(req.auth.role, req.auth.companyId);
      if (!permissions.has(permission)) {
        res.status(403).json({ error: "You do not have permission to perform this action" });
        return;
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}
