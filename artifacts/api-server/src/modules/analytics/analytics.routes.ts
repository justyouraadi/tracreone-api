import { Router, type IRouter } from "express";
import * as controller from "./analytics.controller";
import { asyncHandler } from "../../lib/asyncHandler";
import { requireAuth } from "../../middlewares/auth";
import { requireCompanyScope } from "../../middlewares/rbac";

const router: IRouter = Router();

router.use(requireAuth, requireCompanyScope);

router.get("/dashboard", asyncHandler(controller.getDashboardAnalytics));
router.get("/pipeline", asyncHandler(controller.getPipelineAnalytics));
router.get("/team-performance", asyncHandler(controller.getTeamPerformance));

export default router;
