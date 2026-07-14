import type { Request, Response } from "express";
import type { z } from "zod";
import { prisma } from "../../config/prisma";
import type { AuthenticatedRequest } from "../../middlewares/auth";
import { ApiError } from "../../middlewares/errorHandler";
import type { listNotificationsQuerySchema } from "./notification.schema";

export async function listNotifications(req: AuthenticatedRequest, res: Response) {
  const query = (req as Request & { validatedQuery: z.infer<typeof listNotificationsQuerySchema> }).validatedQuery;
  const where = { userId: req.auth!.sub, ...(query.unreadOnly ? { isRead: false } : {}) };

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId: req.auth!.sub, isRead: false } }),
  ]);

  res.json({ notifications, unreadCount, pagination: { page: query.page, pageSize: query.pageSize, total } });
}

export async function markNotificationRead(req: AuthenticatedRequest, res: Response) {
  const id = Number(req.params.id);
  const notification = await prisma.notification.findUnique({ where: { id } });
  if (!notification || notification.userId !== req.auth!.sub) throw new ApiError(404, "Notification not found");

  const updated = await prisma.notification.update({
    where: { id },
    data: { isRead: true, readAt: new Date() },
  });
  res.json({ notification: updated });
}

export async function markAllNotificationsRead(req: AuthenticatedRequest, res: Response) {
  await prisma.notification.updateMany({
    where: { userId: req.auth!.sub, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });
  res.status(204).send();
}

export async function deleteNotification(req: AuthenticatedRequest, res: Response) {
  const id = Number(req.params.id);
  const notification = await prisma.notification.findUnique({ where: { id } });
  if (!notification || notification.userId !== req.auth!.sub) throw new ApiError(404, "Notification not found");
  await prisma.notification.delete({ where: { id } });
  res.status(204).send();
}
