import { z } from "zod";

export const createLeadStatusSchema = z.object({
  name: z.string().min(1).max(255),
  color: z.string().max(32).optional(),
  order: z.number().int().default(0),
  isDefault: z.boolean().default(false),
  isClosed: z.boolean().default(false),
});

export const updateLeadStatusSchema = createLeadStatusSchema.partial();
