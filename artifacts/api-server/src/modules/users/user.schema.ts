import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().min(2).max(255),
  email: z.string().email(),
  password: z.string().min(8).max(255),
  phone: z.string().min(6).max(32).optional(),
  role: z.enum(["admin", "manager", "agent"]).default("agent"),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).max(255).optional(),
  phone: z.string().min(6).max(32).optional(),
  role: z.enum(["owner", "admin", "manager", "agent"]).optional(),
  isActive: z.boolean().optional(),
});
