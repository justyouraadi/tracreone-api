import { Router, type IRouter } from "express";
import * as controller from "./search.controller";
import { asyncHandler } from "../../lib/asyncHandler";
import { requireAuth } from "../../middlewares/auth";
import { requireCompanyScope } from "../../middlewares/rbac";

const router: IRouter = Router();

router.use(requireAuth, requireCompanyScope);

router.get("/", asyncHandler(controller.globalSearch));

export default router;
