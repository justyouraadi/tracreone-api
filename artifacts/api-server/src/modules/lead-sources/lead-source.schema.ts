import { z } from "zod";

export const createLeadSourceSchema = z.object({
  name: z.string().min(1).max(255),
  isActive: z.boolean().default(true),
});

export const updateLeadSourceSchema = createLeadSourceSchema.partial();
