import { Router, type IRouter } from "express";
import * as controller from "./lead-status.controller";
import { asyncHandler } from "../../lib/asyncHandler";
import { validateBody } from "../../lib/validate";
import { requireAuth } from "../../middlewares/auth";
import { requireCompanyScope } from "../../middlewares/rbac";
import { createLeadStatusSchema, updateLeadStatusSchema } from "./lead-status.schema";

const router: IRouter = Router();

router.use(requireAuth, requireCompanyScope);

router.get("/", asyncHandler(controller.listLeadStatuses));
router.post("/", validateBody(createLeadStatusSchema), asyncHandler(controller.createLeadStatus));
router.patch("/:id", validateBody(updateLeadStatusSchema), asyncHandler(controller.updateLeadStatus));
router.delete("/:id", asyncHandler(controller.deleteLeadStatus));

export default router;
