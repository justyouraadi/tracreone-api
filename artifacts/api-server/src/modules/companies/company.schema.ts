import { z } from "zod";

export const updateCompanySchema = z.object({
  name: z.string().min(2).max(255).optional(),
  isActive: z.boolean().optional(),
});
