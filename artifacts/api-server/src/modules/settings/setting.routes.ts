import { Router, type IRouter } from "express";
import * as controller from "./setting.controller";
import { asyncHandler } from "../../lib/asyncHandler";
import { validateBody } from "../../lib/validate";
import { requireAuth } from "../../middlewares/auth";
import { requireCompanyScope, requirePermission } from "../../middlewares/rbac";
import { PERMISSIONS } from "../../lib/permissions";
import { upsertSettingSchema } from "./setting.schema";

const router: IRouter = Router();

router.use(requireAuth, requireCompanyScope);

router.get("/", asyncHandler(controller.listSettings));
router.get("/:key", asyncHandler(controller.getSetting));
router.put("/:key", requirePermission(PERMISSIONS.SETTINGS_MANAGE), validateBody(upsertSettingSchema), asyncHandler(controller.upsertSetting));
router.delete("/:key", requirePermission(PERMISSIONS.SETTINGS_MANAGE), asyncHandler(controller.deleteSetting));

export default router;
