import { z } from "zod";

export const fieldTypeEnum = z.enum(["text", "number", "boolean", "date", "select", "multiselect"]);

export const createCustomFieldSchema = z.object({
  entityType: z.string().default("lead"),
  name: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-z0-9_]+$/, "name must be snake_case (lowercase letters, numbers, underscores)"),
  label: z.string().min(1).max(255),
  fieldType: fieldTypeEnum,
  options: z.array(z.string()).optional(),
  isRequired: z.boolean().default(false),
  order: z.number().int().default(0),
});

export const updateCustomFieldSchema = createCustomFieldSchema.partial().omit({ name: true });

export const setCustomFieldValueSchema = z.object({
  customFieldId: z.number().int(),
  value: z.string().nullable(),
});
