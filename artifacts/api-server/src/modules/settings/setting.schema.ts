import { z } from "zod";

export const upsertSettingSchema = z.object({
  value: z.unknown(),
});
