import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Response } from "express";

const prismaMock = {
  leadSource: {
    findMany: vi.fn(),
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
};

vi.mock("../../config/prisma", () => ({ prisma: prismaMock }));

const { listLeadSources, createLeadSource, updateLeadSource, deleteLeadSource } = await import(
  "./lead-source.controller"
);

function mockRes(): Response {
  const res: Partial<Response> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.send = vi.fn().mockReturnValue(res);
  return res as Response;
}

function mockReq(overrides: Record<string, unknown> = {}) {
  return {
    auth: { sub: 1, companyId: 10, role: "owner" },
    body: {},
    params: {},
    ...overrides,
  } as any;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("listLeadSources", () => {
  it("scopes the query to the caller's company", async () => {
    prismaMock.leadSource.findMany.mockResolvedValue([{ id: 1, name: "Referral" }]);
    const req = mockReq();
    const res = mockRes();

    await listLeadSources(req, res);

    expect(prismaMock.leadSource.findMany).toHaveBeenCalledWith({
      where: { companyId: 10 },
      orderBy: { name: "asc" },
    });
    expect(res.json).toHaveBeenCalledWith({ leadSources: [{ id: 1, name: "Referral" }] });
  });
});

describe("createLeadSource", () => {
  it("stamps the company id from the auth context and returns 201", async () => {
    prismaMock.leadSource.create.mockResolvedValue({ id: 2, name: "Facebook Ads", companyId: 10 });
    const req = mockReq({ body: { name: "Facebook Ads" } });
    const res = mockRes();

    await createLeadSource(req, res);

    expect(prismaMock.leadSource.create).toHaveBeenCalledWith({
      data: { name: "Facebook Ads", companyId: 10 },
    });
    expect(res.status).toHaveBeenCalledWith(201);
  });
});

describe("updateLeadSource / deleteLeadSource ownership checks", () => {
  it("rejects updating a lead source belonging to another company", async () => {
    prismaMock.leadSource.findUnique.mockResolvedValue({ id: 5, companyId: 999 });
    const req = mockReq({ params: { id: "5" }, body: { name: "x" } });
    const res = mockRes();

    await expect(updateLeadSource(req, res)).rejects.toMatchObject({ status: 404 });
    expect(prismaMock.leadSource.update).not.toHaveBeenCalled();
  });

  it("rejects deleting a nonexistent lead source", async () => {
    prismaMock.leadSource.findUnique.mockResolvedValue(null);
    const req = mockReq({ params: { id: "999" } });
    const res = mockRes();

    await expect(deleteLeadSource(req, res)).rejects.toMatchObject({ status: 404 });
    expect(prismaMock.leadSource.delete).not.toHaveBeenCalled();
  });

  it("allows deleting a lead source owned by the caller's company", async () => {
    prismaMock.leadSource.findUnique.mockResolvedValue({ id: 5, companyId: 10 });
    prismaMock.leadSource.delete.mockResolvedValue({});
    const req = mockReq({ params: { id: "5" } });
    const res = mockRes();

    await deleteLeadSource(req, res);

    expect(prismaMock.leadSource.delete).toHaveBeenCalledWith({ where: { id: 5 } });
    expect(res.status).toHaveBeenCalledWith(204);
  });
});
