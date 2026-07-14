import { Router, type IRouter } from "express";
import * as controller from "./tag.controller";
import { asyncHandler } from "../../lib/asyncHandler";
import { validateBody } from "../../lib/validate";
import { requireAuth } from "../../middlewares/auth";
import { requireCompanyScope } from "../../middlewares/rbac";
import { createTagSchema } from "./tag.schema";

const router: IRouter = Router();

router.use(requireAuth, requireCompanyScope);

router.get("/", asyncHandler(controller.listTags));
router.post("/", validateBody(createTagSchema), asyncHandler(controller.createTag));
router.delete("/:id", asyncHandler(controller.deleteTag));

export default router;
