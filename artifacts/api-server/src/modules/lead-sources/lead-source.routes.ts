import { Router, type IRouter } from "express";
import * as controller from "./lead-source.controller";
import { asyncHandler } from "../../lib/asyncHandler";
import { validateBody } from "../../lib/validate";
import { requireAuth } from "../../middlewares/auth";
import { requireCompanyScope } from "../../middlewares/rbac";
import { createLeadSourceSchema, updateLeadSourceSchema } from "./lead-source.schema";

const router: IRouter = Router();

router.use(requireAuth, requireCompanyScope);

router.get("/", asyncHandler(controller.listLeadSources));
router.post("/", validateBody(createLeadSourceSchema), asyncHandler(controller.createLeadSource));
router.patch("/:id", validateBody(updateLeadSourceSchema), asyncHandler(controller.updateLeadSource));
router.delete("/:id", asyncHandler(controller.deleteLeadSource));

export default router;
