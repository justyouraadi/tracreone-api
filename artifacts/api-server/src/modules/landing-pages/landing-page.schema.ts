import { z } from "zod";

export const createLandingPageSchema = z.object({
  propertyname: z.string().max(255).optional(),
  propertylocation: z.string().max(255).optional(),
  budget: z.string().max(255).optional(),
  description: z.string().optional(),
  amenities: z.string().optional(),
  imageurl: z.string().url().optional(),
  logourl: z.string().url().optional(),
  slug: z
    .string()
    .max(255)
    .regex(/^[a-z0-9-]+$/, "slug must be lowercase letters, numbers, and hyphens only"),
  themename: z.string().max(255).optional(),
  fontpairing: z.string().max(255).optional(),
  herotitle: z.string().optional(),
  herosubtitle: z.string().optional(),
  showtestimonials: z.boolean().optional(),
  showfaqs: z.boolean().optional(),
  showpricing: z.boolean().optional(),
  testimonialsjson: z.string().optional(),
  faqsjson: z.string().optional(),
  pricingplansjson: z.string().optional(),
  ctatitle: z.string().optional(),
  ctasubtitle: z.string().optional(),
  customdomain: z.string().max(255).optional(),
  sectionorder: z.string().optional(),
});

export const updateLandingPageSchema = createLandingPageSchema.partial();

export const listLandingPagesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  isPublished: z.coerce.boolean().optional(),
});
