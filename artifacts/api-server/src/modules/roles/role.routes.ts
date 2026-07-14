import { Router, type IRouter } from "express";
import * as controller from "./role.controller";
import { asyncHandler } from "../../lib/asyncHandler";
import { validateBody } from "../../lib/validate";
import { requireAuth } from "../../middlewares/auth";
import { requireCompanyScope, requireRole } from "../../middlewares/rbac";
import { updateRolePermissionsSchema } from "./role.schema";

const router: IRouter = Router();

router.use(requireAuth, requireCompanyScope);

router.get("/permissions", asyncHandler(controller.listPermissions));
router.get("/", asyncHandler(controller.listRolePermissions));
router.put(
  "/:role/permissions",
  requireRole("owner", "admin"),
  validateBody(updateRolePermissionsSchema),
  asyncHandler(controller.updateRolePermissions),
);

export default router;
