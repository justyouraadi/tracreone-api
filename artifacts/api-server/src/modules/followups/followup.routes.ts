import { Router, type IRouter } from "express";
import * as controller from "./followup.controller";
import { asyncHandler } from "../../lib/asyncHandler";
import { validateBody, validateQuery } from "../../lib/validate";
import { requireAuth } from "../../middlewares/auth";
import { requireCompanyScope } from "../../middlewares/rbac";
import { createFollowUpSchema, updateFollowUpSchema, listFollowUpsQuerySchema } from "./followup.schema";

const router: IRouter = Router();

router.use(requireAuth, requireCompanyScope);

router.get("/", validateQuery(listFollowUpsQuerySchema), asyncHandler(controller.listFollowUps));
router.post("/", validateBody(createFollowUpSchema), asyncHandler(controller.createFollowUp));
router.patch("/:id", validateBody(updateFollowUpSchema), asyncHandler(controller.updateFollowUp));
router.delete("/:id", asyncHandler(controller.deleteFollowUp));

export default router;
