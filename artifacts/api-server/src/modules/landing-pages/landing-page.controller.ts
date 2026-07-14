import type { Request, Response } from "express";
import type { z } from "zod";
import { prisma } from "../../config/prisma";
import type { AuthenticatedRequest } from "../../middlewares/auth";
import { ApiError } from "../../middlewares/errorHandler";
import { logActivity } from "../activity/activity.service";
import type { listLandingPagesQuerySchema } from "./landing-page.schema";

async function assertOwned(id: number, companyId: number) {
  const page = await prisma.landing_pages.findUnique({ where: { id } });
  if (!page || page.companyId !== companyId) throw new ApiError(404, "Landing page not found");
  return page;
}

export async function listLandingPages(req: AuthenticatedRequest, res: Response) {
  const query = (req as Request & { validatedQuery: z.infer<typeof listLandingPagesQuerySchema> }).validatedQuery;
  const companyId = req.auth!.companyId!;
  const where = { companyId, ...(query.isPublished !== undefined ? { isPublished: query.isPublished } : {}) };

  const [landingPages, total] = await Promise.all([
    prisma.landing_pages.findMany({
      where,
      orderBy: { id: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.landing_pages.count({ where }),
  ]);

  res.json({ landingPages, pagination: { page: query.page, pageSize: query.pageSize, total } });
}

export async function getLandingPage(req: AuthenticatedRequest, res: Response) {
  const page = await assertOwned(Number(req.params.id), req.auth!.companyId!);
  res.json({ landingPage: page });
}

export async function createLandingPage(req: AuthenticatedRequest, res: Response) {
  const companyId = req.auth!.companyId!;
  const existing = await prisma.landing_pages.findFirst({ where: { slug: req.body.slug } });
  if (existing) throw new ApiError(409, "A landing page with this slug already exists");

  const page = await prisma.landing_pages.create({
    data: { ...req.body, companyId, createdBy: req.auth!.sub, createdat: BigInt(Date.now()) },
  });
  await logActivity({ companyId, userId: req.auth!.sub, action: "landing_page.created", metadata: { landingPageId: page.id } });
  res.status(201).json({ landingPage: page });
}

export async function updateLandingPage(req: AuthenticatedRequest, res: Response) {
  const existing = await assertOwned(Number(req.params.id), req.auth!.companyId!);
  if (req.body.slug && req.body.slug !== existing.slug) {
    const clash = await prisma.landing_pages.findFirst({ where: { slug: req.body.slug, NOT: { id: existing.id } } });
    if (clash) throw new ApiError(409, "A landing page with this slug already exists");
  }
  const page = await prisma.landing_pages.update({ where: { id: existing.id }, data: req.body });
  await logActivity({ companyId: req.auth!.companyId, userId: req.auth!.sub, action: "landing_page.updated", metadata: { landingPageId: page.id } });
  res.json({ landingPage: page });
}

export async function publishLandingPage(req: AuthenticatedRequest, res: Response) {
  const existing = await assertOwned(Number(req.params.id), req.auth!.companyId!);
  const publish = req.body.isPublished !== false;
  const page = await prisma.landing_pages.update({
    where: { id: existing.id },
    data: { isPublished: publish, publishedAt: publish ? new Date() : null },
  });
  await logActivity({
    companyId: req.auth!.companyId,
    userId: req.auth!.sub,
    action: publish ? "landing_page.published" : "landing_page.unpublished",
    metadata: { landingPageId: page.id },
  });
  res.json({ landingPage: page });
}

export async function deleteLandingPage(req: AuthenticatedRequest, res: Response) {
  const existing = await assertOwned(Number(req.params.id), req.auth!.companyId!);
  await prisma.landing_pages.delete({ where: { id: existing.id } });
  res.status(204).send();
}

// Public, unauthenticated read for the Android app / public site to render
// a published landing page by slug.
export async function getPublicLandingPageBySlug(req: Request, res: Response) {
  const page = await prisma.landing_pages.findFirst({ where: { slug: String(req.params.slug), isPublished: true } });
  if (!page) throw new ApiError(404, "Landing page not found");
  res.json({ landingPage: page });
}
