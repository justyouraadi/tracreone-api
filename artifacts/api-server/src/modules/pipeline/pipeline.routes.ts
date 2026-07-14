import { Router, type IRouter } from "express";
import * as controller from "./pipeline.controller";
import { asyncHandler } from "../../lib/asyncHandler";
import { validateBody } from "../../lib/validate";
import { requireAuth } from "../../middlewares/auth";
import { requireRole, requireCompanyScope } from "../../middlewares/rbac";
import { createStageSchema, updateStageSchema } from "./pipeline.schema";

const router: IRouter = Router();

router.use(requireAuth, requireCompanyScope);

router.get("/", asyncHandler(controller.listStages));
router.post("/", requireRole("owner", "admin", "manager"), validateBody(createStageSchema), asyncHandler(controller.createStage));
router.patch("/:id", requireRole("owner", "admin", "manager"), validateBody(updateStageSchema), asyncHandler(controller.updateStage));
router.delete("/:id", requireRole("owner", "admin"), asyncHandler(controller.deleteStage));

export default router;
