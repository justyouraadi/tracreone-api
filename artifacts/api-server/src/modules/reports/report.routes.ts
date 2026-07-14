import { Router, type IRouter } from "express";
import * as controller from "./report.controller";
import { asyncHandler } from "../../lib/asyncHandler";
import { requireAuth } from "../../middlewares/auth";
import { requireCompanyScope, requirePermission } from "../../middlewares/rbac";
import { PERMISSIONS } from "../../lib/permissions";

const router: IRouter = Router();

router.use(requireAuth, requireCompanyScope, requirePermission(PERMISSIONS.REPORTS_VIEW));

router.get("/leads", asyncHandler(controller.getLeadsReport));
router.get("/follow-ups", asyncHandler(controller.getFollowUpsReport));
router.get("/activity", asyncHandler(controller.getActivityReport));

export default router;
