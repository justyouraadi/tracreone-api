import { z } from "zod";

export const createFollowUpSchema = z.object({
  leadId: z.number().int(),
  assignedToId: z.number().int().optional(),
  type: z.enum(["manual", "recurring", "ai_call", "whatsapp"]).default("manual"),
  dueAt: z.coerce.date(),
  recurrenceRule: z.string().optional(),
  notes: z.string().optional(),
});

export const updateFollowUpSchema = z.object({
  assignedToId: z.number().int().optional(),
  dueAt: z.coerce.date().optional(),
  status: z.enum(["pending", "completed", "cancelled"]).optional(),
  notes: z.string().optional(),
});

export const listFollowUpsQuerySchema = z.object({
  status: z.enum(["pending", "completed", "cancelled"]).optional(),
  assignedToId: z.coerce.number().int().optional(),
  leadId: z.coerce.number().int().optional(),
});
