import { z } from "zod";

export const requestUploadUrlSchema = z.object({
  name: z.string().min(1),
  size: z.number().int().positive(),
  contentType: z.string().min(1),
  category: z.enum(["general", "avatar", "lead_attachment", "poster", "import"]).default("general"),
  leadId: z.number().int().optional(),
});

export const confirmUploadSchema = z.object({
  objectPath: z.string().min(1),
  fileName: z.string().min(1),
  mimeType: z.string().optional(),
  sizeBytes: z.number().int().nonnegative().optional(),
  category: z.enum(["general", "avatar", "lead_attachment", "poster", "import"]).default("general"),
  leadId: z.number().int().optional(),
});
