import { Router, type IRouter } from "express";
import * as controller from "./campaign.controller";
import { asyncHandler } from "../../lib/asyncHandler";
import { validateBody, validateQuery } from "../../lib/validate";
import { requireAuth } from "../../middlewares/auth";
import { requireCompanyScope, requirePermission } from "../../middlewares/rbac";
import { PERMISSIONS } from "../../lib/permissions";
import { createCampaignSchema, updateCampaignSchema, listCampaignsQuerySchema } from "./campaign.schema";

const router: IRouter = Router();

router.use(requireAuth, requireCompanyScope);

router.get("/", validateQuery(listCampaignsQuerySchema), asyncHandler(controller.listCampaigns));
router.get("/:id", asyncHandler(controller.getCampaign));
router.get("/:id/performance", asyncHandler(controller.getCampaignPerformance));
router.post("/", requirePermission(PERMISSIONS.CAMPAIGNS_MANAGE), validateBody(createCampaignSchema), asyncHandler(controller.createCampaign));
router.patch("/:id", requirePermission(PERMISSIONS.CAMPAIGNS_MANAGE), validateBody(updateCampaignSchema), asyncHandler(controller.updateCampaign));
router.delete("/:id", requirePermission(PERMISSIONS.CAMPAIGNS_MANAGE), asyncHandler(controller.deleteCampaign));

export default router;
