import { z } from "zod";

export const createCampaignSchema = z.object({
  name: z.string().min(1).max(255),
  type: z.enum(["landing_page", "whatsapp", "email", "manual"]).default("landing_page"),
  status: z.enum(["draft", "active", "paused", "completed"]).default("draft"),
  landingPageId: z.number().int().optional(),
  budget: z.number().nonnegative().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
});

export const updateCampaignSchema = createCampaignSchema.partial();

export const listCampaignsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  status: z.enum(["draft", "active", "paused", "completed"]).optional(),
});
