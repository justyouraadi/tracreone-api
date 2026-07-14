import { Router, type IRouter } from "express";
import * as controller from "./landing-page.controller";
import { asyncHandler } from "../../lib/asyncHandler";
import { validateBody, validateQuery } from "../../lib/validate";
import { requireAuth } from "../../middlewares/auth";
import { requireCompanyScope, requirePermission } from "../../middlewares/rbac";
import { PERMISSIONS } from "../../lib/permissions";
import { createLandingPageSchema, updateLandingPageSchema, listLandingPagesQuerySchema } from "./landing-page.schema";
import { z } from "zod";

const router: IRouter = Router();

// Public route — no auth — for rendering a published landing page.
router.get("/public/:slug", asyncHandler(controller.getPublicLandingPageBySlug));

router.use(requireAuth, requireCompanyScope);

router.get("/", validateQuery(listLandingPagesQuerySchema), asyncHandler(controller.listLandingPages));
router.get("/:id", asyncHandler(controller.getLandingPage));
router.post("/", requirePermission(PERMISSIONS.LANDING_PAGES_MANAGE), validateBody(createLandingPageSchema), asyncHandler(controller.createLandingPage));
router.patch("/:id", requirePermission(PERMISSIONS.LANDING_PAGES_MANAGE), validateBody(updateLandingPageSchema), asyncHandler(controller.updateLandingPage));
router.post(
  "/:id/publish",
  requirePermission(PERMISSIONS.LANDING_PAGES_MANAGE),
  validateBody(z.object({ isPublished: z.boolean().default(true) })),
  asyncHandler(controller.publishLandingPage),
);
router.delete("/:id", requirePermission(PERMISSIONS.LANDING_PAGES_MANAGE), asyncHandler(controller.deleteLandingPage));

export default router;
