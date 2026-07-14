import type { Request, Response } from "express";
import { prisma } from "../../config/prisma";
import { ApiError } from "../../middlewares/errorHandler";
import { logActivity } from "../activity/activity.service";
import { createNotification } from "../../lib/notify";

// Public, unauthenticated lead capture endpoint used by landing pages /
// external forms / the Android app's public capture flow. Resolves the
// owning company from the landing page or campaign so multi-tenant scoping
// stays correct even without an authenticated user.
export async function captureLead(req: Request, res: Response) {
  const body = req.body as {
    name: string;
    phone: string;
    propertyinterest?: string;
    budget?: string;
    notes?: string;
    source?: string;
    landingPageSlug?: string;
    campaignId?: number;
  };

  let companyId: number | null = null;
  let landingPageId: number | null = null;
  let campaignId: number | null = null;

  if (body.landingPageSlug) {
    const page = await prisma.landing_pages.findFirst({ where: { slug: body.landingPageSlug } });
    if (!page) throw new ApiError(404, "Landing page not found");
    companyId = page.companyId;
    landingPageId = page.id;
  }

  if (body.campaignId) {
    const campaign = await prisma.campaign.findUnique({ where: { id: body.campaignId } });
    if (!campaign) throw new ApiError(404, "Campaign not found");
    campaignId = campaign.id;
    companyId = companyId ?? campaign.companyId;
  }

  const defaultStatus = companyId
    ? await prisma.leadStatus.findFirst({ where: { companyId, isDefault: true } })
    : null;

  const lead = await prisma.leads.create({
    data: {
      name: body.name,
      phone: body.phone,
      propertyinterest: body.propertyinterest,
      budget: body.budget,
      notes: body.notes,
      source: body.source ?? "landing_page",
      timestamp: BigInt(Date.now()),
      companyId,
      landingPageId,
      campaignId,
      status: defaultStatus?.name ?? "new",
    },
  });

  await logActivity({ companyId, action: "lead.captured", leadId: lead.id, metadata: { source: body.source } });

  if (companyId) {
    const owners = await prisma.user.findMany({
      where: { companyId, role: { in: ["owner", "admin", "manager"] }, isActive: true },
      select: { id: true },
    });
    await Promise.all(
      owners.map((owner) =>
        createNotification({
          companyId,
          userId: owner.id,
          title: "New lead captured",
          message: `${body.name} submitted an inquiry${body.propertyinterest ? ` for ${body.propertyinterest}` : ""}.`,
          type: "lead_assigned",
          metadata: { leadId: lead.id },
        }),
      ),
    );
  }

  res.status(201).json({ lead: { id: lead.id, name: lead.name, status: lead.status } });
}
