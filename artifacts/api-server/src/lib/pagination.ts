import { z } from "zod";

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

export function paginationMeta(page: number, pageSize: number, total: number) {
  return {
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export function skipTake(page: number, pageSize: number) {
  return { skip: (page - 1) * pageSize, take: pageSize };
}

export function buildSortSchema<T extends [string, ...string[]]>(fields: T, defaultField: T[number]) {
  return z.object({
    sortBy: z.enum(fields).default(defaultField),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  });
}
