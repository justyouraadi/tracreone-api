import { z } from "zod";

export const roleEnum = z.enum(["owner", "admin", "manager", "agent"]);

export const updateRolePermissionsSchema = z.object({
  permissionKeys: z.array(z.string()),
});
