import { Router, type IRouter } from "express";
import * as controller from "./notification.controller";
import { asyncHandler } from "../../lib/asyncHandler";
import { validateQuery } from "../../lib/validate";
import { requireAuth } from "../../middlewares/auth";
import { listNotificationsQuerySchema } from "./notification.schema";

const router: IRouter = Router();

router.use(requireAuth);

router.get("/", validateQuery(listNotificationsQuerySchema), asyncHandler(controller.listNotifications));
router.post("/read-all", asyncHandler(controller.markAllNotificationsRead));
router.post("/:id/read", asyncHandler(controller.markNotificationRead));
router.delete("/:id", asyncHandler(controller.deleteNotification));

export default router;
