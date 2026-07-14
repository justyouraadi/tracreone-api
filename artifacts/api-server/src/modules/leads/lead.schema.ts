import { z } from "zod";

export const createLeadSchema = z.object({
  name: z.string().max(255).optional(),
  phone: z.string().max(255).optional(),
  propertyinterest: z.string().max(255).optional(),
  budget: z.string().max(255).optional(),
  status: z.string().max(255).default("new"),
  notes: z.string().optional(),
  source: z.string().max(255).optional(),
  stageId: z.number().int().optional(),
  ownerId: z.number().int().optional(),
  assignedTo: z.number().int().optional(),
});

export const updateLeadSchema = createLeadSchema.partial();

export const assignLeadSchema = z.object({
  assignedTo: z.number().int().nullable(),
});

export const createNoteSchema = z.object({
  content: z.string().min(1),
});

export const attachTagSchema = z.object({
  tagId: z.number().int(),
});

export const listLeadsQuerySchema = z.object({
  status: z.string().optional(),
  assignedTo: z.coerce.number().int().optional(),
  ownerId: z.coerce.number().int().optional(),
  stageId: z.coerce.number().int().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});
