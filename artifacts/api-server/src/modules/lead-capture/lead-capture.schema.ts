import { z } from "zod";

export const captureLeadSchema = z.object({
  name: z.string().min(1).max(255),
  phone: z.string().min(5).max(32),
  propertyinterest: z.string().max(255).optional(),
  budget: z.string().max(255).optional(),
  notes: z.string().optional(),
  source: z.string().max(255).optional(),
  landingPageSlug: z.string().optional(),
  campaignId: z.number().int().optional(),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
});
