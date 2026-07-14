import type { Request, Response } from "express";
import { prisma } from "../../config/prisma";
import type { AuthenticatedRequest } from "../../middlewares/auth";
import { ApiError } from "../../middlewares/errorHandler";

// Global search across leads, users, campaigns, and landing pages, scoped
// to the caller's company. Each result type is capped to keep the response
// small; clients can drill into a specific module's own list endpoint for
// full pagination.
export async function globalSearch(req: AuthenticatedRequest, res: Response) {
  const q = String(req.query.q ?? "").trim();
  if (q.length < 2) throw new ApiError(400, "Query must be at least 2 characters");
  const companyId = req.auth!.companyId!;
  const RESULT_LIMIT = 10;

  const [leads, users, campaigns, landingPages] = await Promise.all([
    prisma.leads.findMany({
      where: {
        companyId,
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { phone: { contains: q, mode: "insensitive" } },
          { propertyinterest: { contains: q, mode: "insensitive" } },
        ],
      },
      take: RESULT_LIMIT,
      select: { id: true, name: true, phone: true, status: true },
    }),
    prisma.user.findMany({
      where: {
        companyId,
        isActive: true,
        OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }],
      },
      take: RESULT_LIMIT,
      select: { id: true, name: true, email: true, role: true },
    }),
    prisma.campaign.findMany({
      where: { companyId, name: { contains: q, mode: "insensitive" } },
      take: RESULT_LIMIT,
      select: { id: true, name: true, status: true },
    }),
    prisma.landing_pages.findMany({
      where: { companyId, OR: [{ propertyname: { contains: q, mode: "insensitive" } }, { slug: { contains: q, mode: "insensitive" } }] },
      take: RESULT_LIMIT,
      select: { id: true, propertyname: true, slug: true, isPublished: true },
    }),
  ]);

  res.json({
    query: q,
    results: {
      leads: leads.map((l) => ({ type: "lead", id: l.id, title: l.name, subtitle: l.phone, status: l.status })),
      users: users.map((u) => ({ type: "user", id: u.id, title: u.name, subtitle: u.email, role: u.role })),
      campaigns: campaigns.map((c) => ({ type: "campaign", id: c.id, title: c.name, status: c.status })),
      landingPages: landingPages.map((p) => ({ type: "landing_page", id: p.id, title: p.propertyname, slug: p.slug, isPublished: p.isPublished })),
    },
  });
}
