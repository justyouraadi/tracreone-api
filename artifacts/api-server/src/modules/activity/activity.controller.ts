import type { Response, Request } from "express";
import { prisma } from "../../config/prisma";
import type { AuthenticatedRequest } from "../../middlewares/auth";

export async function listActivity(req: AuthenticatedRequest, res: Response) {
  const query = req.query as { leadId?: string; page?: string; pageSize?: string };
  const page = Number(query.page ?? 1);
  const pageSize = Math.min(Number(query.pageSize ?? 50), 100);

  const activity = await prisma.activityLog.findMany({
    where: {
      companyId: req.auth!.companyId,
      leadId: query.leadId ? Number(query.leadId) : undefined,
    },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });
  res.json({ activity });
}
