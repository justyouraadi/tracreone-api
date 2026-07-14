import { Router, type IRouter } from "express";
import * as controller from "./company.controller";
import { asyncHandler } from "../../lib/asyncHandler";
import { validateBody } from "../../lib/validate";
import { requireAuth } from "../../middlewares/auth";
import { requireRole, requireCompanyScope } from "../../middlewares/rbac";
import { updateCompanySchema } from "./company.schema";

const router: IRouter = Router();

router.use(requireAuth);

router.get("/", requireCompanyScope, asyncHandler(controller.getCurrentCompany));
router.patch(
  "/",
  requireCompanyScope,
  requireRole("owner", "admin"),
  validateBody(updateCompanySchema),
  asyncHandler(controller.updateCurrentCompany),
);
router.get("/all", requireRole("super_admin"), asyncHandler(controller.listCompanies));

export default router;
