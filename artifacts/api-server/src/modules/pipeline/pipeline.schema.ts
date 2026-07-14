import { z } from "zod";

export const createStageSchema = z.object({
  name: z.string().min(1).max(255),
  order: z.number().int().min(0).default(0),
  isWon: z.boolean().default(false),
  isLost: z.boolean().default(false),
  color: z.string().max(32).optional(),
});

export const updateStageSchema = createStageSchema.partial();
