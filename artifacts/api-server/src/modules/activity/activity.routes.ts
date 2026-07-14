import { Router, type IRouter } from "express";
import * as controller from "./activity.controller";
import { asyncHandler } from "../../lib/asyncHandler";
import { requireAuth } from "../../middlewares/auth";
import { requireCompanyScope } from "../../middlewares/rbac";

const router: IRouter = Router();

router.use(requireAuth, requireCompanyScope);
router.get("/", asyncHandler(controller.listActivity));

export default router;
