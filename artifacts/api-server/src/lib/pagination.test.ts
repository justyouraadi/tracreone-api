import { describe, it, expect } from "vitest";
import { paginationMeta, skipTake, paginationQuerySchema, buildSortSchema } from "./pagination";

describe("paginationQuerySchema", () => {
  it("applies defaults when omitted", () => {
    const result = paginationQuerySchema.parse({});
    expect(result).toEqual({ page: 1, pageSize: 25 });
  });

  it("coerces string query params to numbers", () => {
    const result = paginationQuerySchema.parse({ page: "3", pageSize: "10" });
    expect(result).toEqual({ page: 3, pageSize: 10 });
  });

  it("rejects pageSize above the max", () => {
    expect(() => paginationQuerySchema.parse({ pageSize: 500 })).toThrow();
  });
});

describe("paginationMeta", () => {
  it("computes totalPages correctly", () => {
    expect(paginationMeta(1, 25, 100)).toEqual({ page: 1, pageSize: 25, total: 100, totalPages: 4 });
  });

  it("returns at least 1 total page when total is 0", () => {
    expect(paginationMeta(1, 25, 0).totalPages).toBe(1);
  });
});

describe("skipTake", () => {
  it("computes skip/take for page 1", () => {
    expect(skipTake(1, 25)).toEqual({ skip: 0, take: 25 });
  });

  it("computes skip/take for page 3", () => {
    expect(skipTake(3, 10)).toEqual({ skip: 20, take: 10 });
  });
});

describe("buildSortSchema", () => {
  it("applies the given default field", () => {
    const schema = buildSortSchema(["createdAt", "name"], "name");
    expect(schema.parse({})).toEqual({ sortBy: "name", sortOrder: "desc" });
  });

  it("rejects sort fields outside the allowed enum", () => {
    const schema = buildSortSchema(["createdAt", "name"], "name");
    expect(() => schema.parse({ sortBy: "notAllowed" })).toThrow();
  });
});
